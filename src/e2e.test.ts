import { TOMLParser } from './parser';

const tomlString = `
[package]
name = "bluetooth-battery-monitor"
version = "0.3.0"
description = "Deno + Tauri app"
edition = "2021"
build = "src/build.rs"

[build-dependencies]
tauri-build = { version = "1.2.1", features = [] }

[dependencies]
anyhow = { version = "1.0.70" }
bincode = { version = "1.3.3" }
env_logger = { version = "0.10.0" }
log = { version = "0.4.17" }
once_cell = { version = "1.17.1" }
serde = { version = "1.0.156", features = ["derive"] }
serde_json = { version = "1.0.95" }
tauri = { version = "1.3.0", features = [
  "api-all",
  "icon-ico",
  "icon-png",
  "system-tray",
] }
tauri-plugin-autostart = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "dev" }
tauri-plugin-window-state = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "dev" }
tokio = { version = "1.27.0", features = ["time", "sync"] }
toml = { version = "0.7.3" }

[target.'cfg(windows)'.dependencies]
windows = { version = "0.48.0", features = [
  "Devices_Bluetooth_Rfcomm",
  "Devices_Enumeration",
  "Foundation",
  "Foundation_Collections",
  "Networking_Proximity",
  "Win32_Devices_Bluetooth",
  "Win32_Foundation",
  "Win32_Networking_WinSock",
  "Win32_System_Rpc",
  "Win32_System_Threading",
] }

[dev-dependencies]
tokio = { version = "1.27.0", features = ["time", "macros", "rt"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
`;

test('parse toml', () => {
  const parsedTOML = new TOMLParser(tomlString).parse();
  expect(parsedTOML).toBe({});
});
