mod commands;
mod filesystem;
mod menu;
mod preferences;
mod window;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        & !tauri_plugin_window_state::StateFlags::DECORATIONS,
                )
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::filesystem::read_markdown_file,
            commands::filesystem::write_markdown_file,
            commands::filesystem::list_directory,
            commands::filesystem::rename_file,
            commands::filesystem::trash_item,
            commands::filesystem::detect_encoding,
            commands::filesystem::create_directory,
            commands::filesystem::copy_file,
            commands::filesystem::file_exists,
            commands::filesystem::watch_path,
            commands::filesystem::unwatch_path,
            commands::preferences::get_preferences,
            commands::preferences::set_preference,
            commands::preferences::get_preference,
            commands::window::close_window,
            commands::window::toggle_always_on_top,
            commands::window::set_title,
            commands::window::create_editor_window,
            commands::window::create_settings_window,
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_decorations(false);
                #[cfg(debug_assertions)]
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
