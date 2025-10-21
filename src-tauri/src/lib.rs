use open::that;
use qrcode::{render::svg, QrCode};
use std::env;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn generate_qrcode(url: &str) -> String {
    let qr_code = QrCode::with_error_correction_level(url, qrcode::EcLevel::H).unwrap();
    let imges = qr_code
        .render()
        .min_dimensions(200, 200)
        .dark_color(svg::Color("#000000"))
        .light_color(svg::Color("#ffffff"))
        .build();
    imges
}

#[tauri::command]
fn get_downloads_path() -> String {
    match dirs::home_dir() {
        Some(home) => {
            let downloads = home.join("Downloads");
            downloads.to_string_lossy().to_string()
        }
        None => {
            // 如果无法获取用户目录，返回当前目录
            env::current_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."))
                .to_string_lossy()
                .to_string()
        }
    }
}

#[tauri::command]
fn open_downloads_folder() -> Result<(), String> {
    match dirs::home_dir() {
        Some(home) => {
            let downloads = home.join("Downloads");
            that(downloads).map_err(|e| format!("无法打开下载文件夹: {}", e))
        }
        None => {
            // 如果无法获取用户目录，尝试打开当前目录
            that(".").map_err(|e| format!("无法打开当前目录: {}", e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            generate_qrcode,
            get_downloads_path,
            open_downloads_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
