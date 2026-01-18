export const cloudProviderOptions = [{
  label: 'None',
  value: 'none'
}, {
  label: 'Dropbox',
  value: 'dropbox'
}, {
  label: 'Google Drive',
  value: 'googledrive'
}, {
  label: 'OneDrive',
  value: 'onedrive'
}]

export const syncModeOptions = [{
  label: 'Manual',
  value: 'manual'
}, {
  label: 'Auto (on save)',
  value: 'auto'
}, {
  label: 'Every 5 minutes',
  value: 'interval_5'
}, {
  label: 'Every 15 minutes',
  value: 'interval_15'
}, {
  label: 'Every 30 minutes',
  value: 'interval_30'
}, {
  label: 'Every hour',
  value: 'interval_60'
}]

export const syncDirectionOptions = [{
  label: 'Two-way sync',
  value: 'twoway'
}, {
  label: 'Upload only',
  value: 'upload'
}, {
  label: 'Download only',
  value: 'download'
}]

export const conflictResolutionOptions = [{
  label: 'Ask me',
  value: 'ask'
}, {
  label: 'Keep local version',
  value: 'local'
}, {
  label: 'Keep remote version',
  value: 'remote'
}, {
  label: 'Keep both (rename)',
  value: 'both'
}]

export const filenameEncryptionOptions = [{
  label: 'Off (no encryption)',
  value: 'off'
}, {
  label: 'Standard',
  value: 'standard'
}, {
  label: 'Obfuscate',
  value: 'obfuscate'
}]

export const directoryNameEncryptionOptions = [{
  label: 'True',
  value: true
}, {
  label: 'False',
  value: false
}]
