// Filesystem utilities for MarkText Tauri backend
// Core file operations are implemented in commands/filesystem.rs
// This module provides shared helpers

use std::path::Path;

pub fn is_markdown_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            matches!(
                ext.to_lowercase().as_str(),
                "md" | "markdown" | "mmd" | "mdown" | "mdtxt" | "mdtext" | "rmd"
            )
        })
        .unwrap_or(false)
}

pub fn normalize_path(path: &str) -> String {
    path.replace('\\', "/")
}
