import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [qrCode, setQrCode] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadPath, setDownloadPath] = useState("");
  const [urlValidation, setUrlValidation] = useState({
    isValid: false,
    message: "",
    type: "info" as "info" | "warning" | "error",
  });

  async function generateQRCode() {
    if (!url.trim()) {
      setError("请输入有效的URL地址");
      return;
    }

    // 检查URL验证结果
    if (!urlValidation.isValid) {
      setError(urlValidation.message || "请输入有效的URL地址");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await invoke<string>("generate_qrcode", {
        url: url.trim(),
      });
      setQrCode(result);
    } catch (err) {
      setError("生成二维码失败，请重试");
      console.error("Error generating QR code:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function downloadQRCode() {
    if (!qrCode) return;

    try {
      const fileName = `qrcode-${Date.now()}.svg`;
      const blob = new Blob([qrCode], { type: "image/svg+xml" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // 获取下载路径并显示成功提示
      const downloadsPath = await invoke<string>("get_downloads_path");
      const fullPath = `${downloadsPath}/${fileName}`;
      setDownloadPath(fullPath);
      setDownloadSuccess(true);

      // 3秒后自动隐藏成功提示
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
    } catch (err) {
      setError("下载失败，请重试");
      console.error("Error downloading QR code:", err);
    }
  }

  async function openDownloadPath() {
    try {
      await invoke("open_downloads_folder");
    } catch (err) {
      setError("无法打开下载文件夹");
      console.error("Error opening downloads folder:", err);
    }
  }

  // URL验证函数
  function validateUrl(inputUrl: string) {
    if (!inputUrl.trim()) {
      return {
        isValid: false,
        message: "",
        type: "info" as const,
      };
    }

    // 更宽松的URL格式检查
    const urlPattern =
      /^(https?:\/\/)?([\w\.-]+)(:\d+)?([\/\w \.\-#?=&%]*)*\/?$/i;

    if (!urlPattern.test(inputUrl)) {
      return {
        isValid: false,
        message: "URL格式不正确，请检查输入",
        type: "error" as const,
      };
    }

    // 检查是否包含协议
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      return {
        isValid: true,
        message: "建议使用HTTPS协议以确保安全性",
        type: "warning" as const,
      };
    }

    // 检查是否是HTTPS
    if (inputUrl.startsWith("http://")) {
      return {
        isValid: true,
        message: "建议使用HTTPS协议以确保安全性",
        type: "warning" as const,
      };
    }

    // 检查是否是HTTPS
    if (inputUrl.startsWith("https://")) {
      return {
        isValid: true,
        message: "URL格式正确",
        type: "info" as const,
      };
    }

    return {
      isValid: true,
      message: "URL格式正确",
      type: "info" as const,
    };
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // 清除之前的错误
    if (error) setError("");

    // 验证URL
    const validation = validateUrl(newUrl);
    setUrlValidation(validation);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="qr-icon">📱</span>
            QR码生成器
          </h1>
          <p className="subtitle">快速生成美观的二维码</p>
        </div>
      </header>

      <main className="main">
        <div className="card">
          <div className="input-section">
            <label htmlFor="url-input" className="input-label">
              输入URL地址
            </label>
            <div className="input-group">
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                className="url-input"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={generateQRCode}
                disabled={isLoading || !url.trim()}
                className="generate-btn"
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  "生成二维码"
                )}
              </button>
            </div>
            {urlValidation.message && (
              <div
                className={`validation-message validation-${urlValidation.type}`}
              >
                <span className="validation-icon">
                  {urlValidation.type === "error"
                    ? "❌"
                    : urlValidation.type === "warning"
                    ? "⚠️"
                    : "ℹ️"}
                </span>
                {urlValidation.message}
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            {downloadSuccess && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                下载完成！文件已保存到：{downloadPath}
              </div>
            )}
          </div>

          {qrCode && (
            <div className="result-section">
              <div className="qr-container">
                <div
                  className="qr-code"
                  dangerouslySetInnerHTML={{ __html: qrCode }}
                />
              </div>
              <div className="action-buttons">
                <button onClick={downloadQRCode} className="download-btn">
                  <span className="download-icon">⬇️</span>
                  下载二维码
                </button>
                <button onClick={openDownloadPath} className="open-folder-btn">
                  <span className="folder-icon">📁</span>
                  打开文件夹
                </button>
                <button
                  onClick={() => {
                    setQrCode("");
                    setUrl("");
                    setError("");
                    setDownloadSuccess(false);
                    setDownloadPath("");
                    setUrlValidation({
                      isValid: false,
                      message: "",
                      type: "info",
                    });
                  }}
                  className="clear-btn"
                >
                  <span className="clear-icon">🗑️</span>
                  清除
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>
          GitHub:{" "}
          <a
            href="https://github.com/lbemi/qrcode"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/lbemi/qrcode
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
