<template>
  <div class="pref-sync">
    <h4>Cloud Sync (Rclone)</h4>

    <compound>
      <template #head>
        <h6 class="title">Rclone Information:</h6>
      </template>
      <template #children>
        <div class="rclone-info-card">
          <div class="info-row">
            <span class="info-label">Version:</span>
            <span class="info-value">{{ rcloneVersion || 'Not detected' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">OS/Arch:</span>
            <span class="info-value">{{ rcloneOsArch || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span :class="['info-value', rcloneInstalled ? 'installed' : 'not-installed']">
              {{ rcloneInstalled ? 'Installed' : 'Not installed' }}
            </span>
          </div>
          <div class="info-actions">
            <el-button size="small" @click="checkRcloneVersion" :loading="checkingVersion">
              <i class="el-icon-refresh"></i> Refresh
            </el-button>
            <el-button size="small" type="primary" @click="updateRclone" :loading="updatingRclone">
              <i class="el-icon-download"></i> {{ rcloneInstalled ? 'Update Rclone' : 'Install Rclone' }}
            </el-button>
            <el-button size="small" @click="openRcloneWebsite">
              <i class="el-icon-link"></i> Website
            </el-button>
          </div>
        </div>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">Rclone Configuration:</h6>
      </template>
      <template #children>
        <div class="folder-setting">
          <span class="folder-label">Rclone path:</span>
          <span class="folder-path">{{ rclonePath || 'Not set (using system PATH)' }}</span>
          <el-button size="small" @click="selectRclonePath">Browse</el-button>
        </div>

        <text-box
          description="Remote name (configured in rclone)"
          :input="rcloneRemote"
          :onChange="value => onSelectChange('rcloneRemote', value)"
        ></text-box>

        <div class="rclone-status">
          <el-button size="small" @click="testRcloneConnection">
            <i class="el-icon-connection"></i> Test Connection
          </el-button>
          <el-button size="small" @click="openRcloneConfig">
            <i class="el-icon-setting"></i> Open Rclone Config
          </el-button>
          <span :class="['status-text', rcloneStatus]">{{ rcloneStatusText }}</span>
        </div>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">Encryption (Rclone Crypt):</h6>
      </template>
      <template #children>
        <bool
          description="Enable encryption"
          :bool="rcloneEncryptEnabled"
          :onChange="value => onSelectChange('rcloneEncryptEnabled', value)"
        ></bool>

        <template v-if="rcloneEncryptEnabled">
          <div class="password-field">
            <span class="field-label">Password:</span>
            <el-input
              :type="showPassword ? 'text' : 'password'"
              v-model="encryptPassword"
              size="small"
              @change="onPasswordChange"
            >
              <el-button slot="append" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'el-icon-view' : 'el-icon-hide'"></i>
              </el-button>
            </el-input>
          </div>

          <div class="password-field">
            <span class="field-label">Password2 (salt):</span>
            <el-input
              :type="showPassword2 ? 'text' : 'password'"
              v-model="encryptPassword2"
              size="small"
              @change="onPassword2Change"
            >
              <el-button slot="append" @click="showPassword2 = !showPassword2">
                <i :class="showPassword2 ? 'el-icon-view' : 'el-icon-hide'"></i>
              </el-button>
            </el-input>
          </div>

          <cur-select
            description="Filename encryption"
            :value="rcloneFilenameEncryption"
            :options="filenameEncryptionOptions"
            :onChange="value => onSelectChange('rcloneFilenameEncryption', value)"
          ></cur-select>

          <bool
            description="Encrypt directory names"
            :bool="rcloneDirectoryNameEncryption"
            :onChange="value => onSelectChange('rcloneDirectoryNameEncryption', value)"
          ></bool>
        </template>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">Cloud Provider:</h6>
      </template>
      <template #children>
        <cur-select
          description="Select cloud storage provider"
          :value="syncProvider"
          :options="cloudProviderOptions"
          :onChange="value => onSelectChange('syncProvider', value)"
        ></cur-select>

        <div class="provider-auth" v-if="syncProvider !== 'none'">
          <div class="auth-status">
            <span class="status-label">Status:</span>
            <span :class="['status-value', syncConnected ? 'connected' : 'disconnected']">
              {{ syncConnected ? 'Connected' : 'Not connected' }}
            </span>
          </div>
          <el-button
            :type="syncConnected ? 'danger' : 'primary'"
            size="small"
            @click="handleAuth"
          >
            {{ syncConnected ? 'Disconnect' : 'Connect' }}
          </el-button>
        </div>
      </template>
    </compound>

    <compound v-if="syncProvider !== 'none' && syncConnected">
      <template #head>
        <h6 class="title">Sync Settings:</h6>
      </template>
      <template #children>
        <bool
          description="Enable cloud sync"
          :bool="syncEnabled"
          :onChange="value => onSelectChange('syncEnabled', value)"
        ></bool>

        <cur-select
          description="Sync mode"
          :value="syncMode"
          :options="syncModeOptions"
          :onChange="value => onSelectChange('syncMode', value)"
        ></cur-select>

        <cur-select
          description="Sync direction"
          :value="syncDirection"
          :options="syncDirectionOptions"
          :onChange="value => onSelectChange('syncDirection', value)"
        ></cur-select>

        <cur-select
          description="Conflict resolution"
          :value="syncConflictResolution"
          :options="conflictResolutionOptions"
          :onChange="value => onSelectChange('syncConflictResolution', value)"
        ></cur-select>
      </template>
    </compound>

    <compound v-if="syncProvider !== 'none' && syncConnected">
      <template #head>
        <h6 class="title">Folder Settings:</h6>
      </template>
      <template #children>
        <div class="folder-setting">
          <span class="folder-label">Local folder:</span>
          <span class="folder-path">{{ syncLocalFolder || 'Not set' }}</span>
          <el-button size="small" @click="selectLocalFolder">Browse</el-button>
        </div>

        <text-box
          description="Remote folder path"
          :input="syncRemoteFolder"
          :onChange="value => onSelectChange('syncRemoteFolder', value)"
        ></text-box>
      </template>
    </compound>

    <compound v-if="syncProvider !== 'none' && syncConnected && syncEnabled">
      <template #head>
        <h6 class="title">Actions:</h6>
      </template>
      <template #children>
        <div class="sync-actions">
          <el-button type="primary" size="small" @click="syncNow">
            <i class="el-icon-refresh"></i> Sync Now
          </el-button>
          <span class="last-sync" v-if="syncLastTime">
            Last sync: {{ formatLastSync }}
          </span>
        </div>
      </template>
    </compound>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ipcRenderer } from 'electron'
import Compound from '../common/compound'
import CurSelect from '../common/select'
import Bool from '../common/bool'
import TextBox from '../common/textBox'

import {
  cloudProviderOptions,
  syncModeOptions,
  syncDirectionOptions,
  conflictResolutionOptions,
  filenameEncryptionOptions
} from './config'

export default {
  components: {
    Compound,
    Bool,
    CurSelect,
    TextBox
  },
  data () {
    this.cloudProviderOptions = cloudProviderOptions
    this.syncModeOptions = syncModeOptions
    this.syncDirectionOptions = syncDirectionOptions
    this.conflictResolutionOptions = conflictResolutionOptions
    this.filenameEncryptionOptions = filenameEncryptionOptions
    return {
      showPassword: false,
      showPassword2: false,
      encryptPassword: '',
      encryptPassword2: '',
      rcloneStatus: '',
      rcloneStatusText: '',
      rcloneVersion: '',
      rcloneOsArch: '',
      rcloneInstalled: false,
      checkingVersion: false,
      updatingRclone: false
    }
  },
  computed: {
    ...mapState({
      syncProvider: state => state.preferences.syncProvider,
      syncEnabled: state => state.preferences.syncEnabled,
      syncMode: state => state.preferences.syncMode,
      syncDirection: state => state.preferences.syncDirection,
      syncConflictResolution: state => state.preferences.syncConflictResolution,
      syncLocalFolder: state => state.preferences.syncLocalFolder,
      syncRemoteFolder: state => state.preferences.syncRemoteFolder,
      syncConnected: state => state.preferences.syncConnected,
      syncLastTime: state => state.preferences.syncLastTime,
      rclonePath: state => state.preferences.rclonePath,
      rcloneRemote: state => state.preferences.rcloneRemote,
      rcloneEncryptEnabled: state => state.preferences.rcloneEncryptEnabled,
      rcloneFilenameEncryption: state => state.preferences.rcloneFilenameEncryption,
      rcloneDirectoryNameEncryption: state => state.preferences.rcloneDirectoryNameEncryption
    }),
    formatLastSync () {
      if (!this.syncLastTime) return ''
      return new Date(this.syncLastTime).toLocaleString()
    }
  },
  created () {
    this.checkRcloneVersion()

    ipcRenderer.on('mt::rclone-test-result', (e, { success, message }) => {
      this.rcloneStatus = success ? 'success' : 'error'
      this.rcloneStatusText = message
    })

    ipcRenderer.on('mt::rclone-version-result', (e, { installed, version, os, arch }) => {
      this.checkingVersion = false
      this.rcloneInstalled = installed
      this.rcloneVersion = version || ''
      this.rcloneOsArch = installed ? `${os}/${arch}` : ''
    })

    ipcRenderer.on('mt::rclone-update-result', (e, { success, message }) => {
      this.updatingRclone = false
      if (success) {
        this.$message.success(message || 'Rclone updated successfully')
        this.checkRcloneVersion()
      } else {
        this.$message.error(message || 'Failed to update rclone')
      }
    })
  },
  methods: {
    onSelectChange (type, value) {
      this.$store.dispatch('SET_SINGLE_PREFERENCE', { type, value })
    },
    onPasswordChange () {
      ipcRenderer.send('mt::set-rclone-password', this.encryptPassword)
    },
    onPassword2Change () {
      ipcRenderer.send('mt::set-rclone-password2', this.encryptPassword2)
    },
    handleAuth () {
      if (this.syncConnected) {
        ipcRenderer.send('mt::sync-disconnect')
      } else {
        ipcRenderer.send('mt::sync-connect', this.syncProvider)
      }
    },
    selectLocalFolder () {
      ipcRenderer.send('mt::select-sync-local-folder')
    },
    selectRclonePath () {
      ipcRenderer.send('mt::select-rclone-path')
    },
    testRcloneConnection () {
      this.rcloneStatus = 'testing'
      this.rcloneStatusText = 'Testing...'
      ipcRenderer.send('mt::test-rclone-connection')
    },
    syncNow () {
      ipcRenderer.send('mt::sync-now')
    },
    checkRcloneVersion () {
      this.checkingVersion = true
      ipcRenderer.send('mt::check-rclone-version')
    },
    updateRclone () {
      this.updatingRclone = true
      ipcRenderer.send('mt::update-rclone')
    },
    openRcloneWebsite () {
      ipcRenderer.send('mt::open-external-link', 'https://rclone.org/downloads/')
    },
    openRcloneConfig () {
      ipcRenderer.send('mt::open-rclone-config')
    }
  }
}
</script>

<style scoped>
.pref-sync {
  & .provider-auth {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 15px;
    padding: 15px;
    background: var(--sideBarBgColor);
    border-radius: 4px;
  }

  & .auth-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  & .status-label {
    color: var(--editorColor50);
    font-size: 14px;
  }

  & .status-value {
    font-size: 14px;
    font-weight: 500;
  }

  & .status-value.connected {
    color: #67c23a;
  }

  & .status-value.disconnected {
    color: #f56c6c;
  }

  & .folder-setting {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }

  & .folder-label {
    color: var(--editorColor);
    font-size: 14px;
    min-width: 100px;
  }

  & .folder-path {
    flex: 1;
    color: var(--editorColor80);
    font-size: 13px;
    padding: 8px 12px;
    background: var(--sideBarBgColor);
    border-radius: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .sync-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  & .last-sync {
    color: var(--editorColor50);
    font-size: 13px;
  }

  & .rclone-status {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 15px;
  }

  & .status-text {
    font-size: 13px;
  }

  & .status-text.success {
    color: #67c23a;
  }

  & .status-text.error {
    color: #f56c6c;
  }

  & .status-text.testing {
    color: #e6a23c;
  }

  & .password-field {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }

  & .field-label {
    color: var(--editorColor);
    font-size: 14px;
    min-width: 120px;
  }

  & .password-field .el-input {
    flex: 1;
    max-width: 300px;
  }

  & .rclone-info-card {
    padding: 15px;
    background: var(--sideBarBgColor);
    border-radius: 6px;
  }

  & .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  & .info-label {
    color: var(--editorColor50);
    font-size: 13px;
    min-width: 80px;
  }

  & .info-value {
    color: var(--editorColor);
    font-size: 13px;
    font-weight: 500;
  }

  & .info-value.installed {
    color: #67c23a;
  }

  & .info-value.not-installed {
    color: #f56c6c;
  }

  & .info-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--editorColor10);
  }
}
</style>
