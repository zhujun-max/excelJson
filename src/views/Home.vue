<template>
  <div class="home">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <i class="el-icon-document-copy"></i>
            <span>Excel / JSON / CSV 互转工具</span>
          </div>
          <div class="header-actions">
            <el-button v-if="jsonData" type="text" icon="el-icon-refresh" @click="resetAll">重置</el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <div class="main-container">
          <el-row :gutter="20" v-if="!jsonData">
            <el-col :span="24">
              <div 
                class="fullscreen-upload-area"
                @dragover.prevent
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <div class="upload-content">
                  <i class="el-icon-upload-filled"></i>
                  <div class="upload-text">
                    <h3>将 Excel / JSON / CSV 文件拖拽至此</h3>
                    <p>或点击上传</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref="fileInput" 
                  style="display: none" 
                  accept=".xlsx, .xls, .json, .csv" 
                  @change="handleFileChange"
                >
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" style="margin-top: 0; height: 100%;" v-if="jsonData">
            <el-col :span="24" style="height: 100%;">
              <el-card class="result-card" :body-style="{ padding: '0px' }" shadow="never">
                <el-tabs type="border-card" v-model="activeTab">
                  <el-tab-pane label="JSON 预览" name="json">
                    <div class="toolbar">
                      <div class="left-tools">
                        <div class="tool-item">
                          <el-button 
                            type="primary" 
                            plain 
                            size="small" 
                            icon="el-icon-setting" 
                            @click="openFieldSettings"
                          >
                            字段配置
                          </el-button>
                        </div>
                      </div>
                      <div class="right-tools">
                        <el-input 
                          v-model="fileName" 
                          placeholder="文件名" 
                          size="small" 
                          style="width: 200px;"
                        >
                        </el-input>
                        <el-button type="primary" size="small" icon="el-icon-document-copy" @click="copyJson">复制 JSON</el-button>
                        <el-button type="success" size="small" icon="el-icon-download" @click="downloadJson">下载 JSON</el-button>
                      </div>
                    </div>

                    <div class="json-editor-container">
                      <div class="line-count-info">共 {{ jsonLineCount }} 行</div>
                      <el-input
                        type="textarea"
                        :rows="20"
                        placeholder="JSON 输出"
                        v-model="jsonString"
                        class="dark-textarea"
                      >
                      </el-input>
                    </div>
                  </el-tab-pane>
                  
                  <el-tab-pane label="表格预览" name="table">
                    <div class="toolbar">
                      <div class="left-tools">
                        <div class="tool-item">
                          <el-button 
                            type="primary" 
                            plain 
                            size="small" 
                            icon="el-icon-setting" 
                            @click="openFieldSettings"
                          >
                            字段配置
                          </el-button>
                        </div>
                        <div class="tool-item info-text" style="margin-left: 15px;">
                          <span>共 {{ processedData.length }} 条数据</span>
                        </div>
                      </div>
                      <div class="right-tools">
                        <el-input 
                          v-model="fileName" 
                          placeholder="文件名" 
                          size="small" 
                          style="width: 200px;"
                        >
                        </el-input>
                        <el-button type="warning" size="small" icon="el-icon-document" @click="exportToExcel">导出 Excel</el-button>
                        <el-button type="info" size="small" icon="el-icon-document" @click="exportToCSV">导出 CSV</el-button>
                      </div>
                    </div>
                    <div class="table-container">
                      <el-table
                        :data="processedData"
                        style="width: 100%; height: 100%;"
                        height="100%"
                        border
                        stripe
                        :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
                        <el-table-column
                          v-for="field in visibleFields"
                          :key="field.key"
                          :prop="field.alias"
                          :label="field.alias"
                          min-width="150"
                          show-overflow-tooltip>
                        </el-table-column>
                      </el-table>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>

    <!-- Field Settings Dialog -->
    <el-dialog
      title="字段配置"
      :visible.sync="dialogVisible"
      width="800px"
      :close-on-click-modal="false"
      custom-class="field-settings-dialog"
    >
      <div class="field-settings-content">
        <el-table :data="tempFieldConfigs" style="width: 100%" border size="small" height="400">
          <el-table-column prop="visible" label="显示" width="80" align="center">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.visible"></el-switch>
            </template>
          </el-table-column>
          <el-table-column prop="key" label="原字段名" min-width="150" show-overflow-tooltip>
             <template slot-scope="scope">
               <span>{{ scope.row.key }}</span>
               <el-tag v-if="scope.row.isHiddenInExcel" type="info" size="mini" style="margin-left: 5px;">Excel隐藏</el-tag>
             </template>
          </el-table-column>
          <el-table-column prop="alias" label="重命名" min-width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.alias" size="mini" placeholder="输入新名称"></el-input>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template slot-scope="scope">
               <el-button type="text" size="mini" @click="openFieldOperations(scope.row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="resetFieldSettings" icon="el-icon-refresh-left" style="float: left;">重置回默认</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFieldSettings">确定</el-button>
      </span>
    </el-dialog>

    <!-- Field Operations Dialog -->
    <el-dialog
      :title="'字段处理: ' + (currentOpField ? currentOpField.alias : '')"
      :visible.sync="opDialogVisible"
      width="500px"
      append-to-body
    >
      <div class="op-list">
        <div class="op-item">
           <h4>基础清洗</h4>
           <div class="op-actions">
             <el-button size="small" @click="deduplicateData">去重</el-button>
             <el-button size="small" @click="removeEmptyRows">删除空行</el-button>
           </div>
        </div>
        <div class="op-item">
           <h4>自定义处理 (JavaScript)</h4>
           <p class="code-hint">使用 value 代表当前字段值，返回新值</p>
           <el-input
             type="textarea"
             :rows="4"
             placeholder="return value.trim();"
             v-model="customCode"
           >
           </el-input>
           <div class="op-actions" style="margin-top: 10px; text-align: right;">
             <el-button type="primary" size="small" @click="applyCustomCode">执行代码</el-button>
           </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { readExcel, exportExcel, exportCSV } from '@/utils/excel';
import FileSaver from 'file-saver';

export default {
  name: 'Home',
  data() {
    return {
      loading: false,
      jsonData: null, // Original data
      jsonString: '',
      fileName: 'data',
      
      // Field Configuration
      fieldConfigs: [], // Array of { key: 'original', alias: 'new', visible: true, isHiddenInExcel: false }
      tempFieldConfigs: [], // For dialog editing
      dialogVisible: false,
      
      // Field Operations
      opDialogVisible: false,
      currentOpField: null,
      customCode: '',

      activeTab: 'json'
    };
  },
  computed: {
    visibleFields() {
      return this.fieldConfigs.filter(f => f.visible);
    },
    processedData() {
      if (!this.jsonData) return [];
      
      // If no config, return original (shouldn't happen ideally if initialized correctly)
      if (this.fieldConfigs.length === 0) return this.jsonData;

      return this.jsonData.map(item => {
        const newItem = {};
        this.fieldConfigs.forEach(config => {
          if (config.visible) {
            // Use alias as the key in the new object
            // If original key exists in item
            if (Object.prototype.hasOwnProperty.call(item, config.key)) {
              newItem[config.alias] = item[config.key];
            }
          }
        });
        return newItem;
      });
    },
    jsonLineCount() {
      if (!this.jsonString) return 0;
      return this.jsonString.split(/\r\n|\r|\n/).length;
    }
  },
  watch: {
    jsonData: {
      handler(val) {
        if (val) {
          this.updateJsonString();
        }
      },
      deep: true
    },
    fieldConfigs: {
      handler() {
        this.updateJsonString();
      },
      deep: true
    }
  },
  methods: {
    resetAll() {
      this.jsonData = null;
      this.jsonString = '';
      this.fileName = 'data';
      this.fieldConfigs = [];
      this.activeTab = 'json';
    },
    // Open Dialog
    openFieldSettings() {
      // Deep copy current configs to temp
      this.tempFieldConfigs = JSON.parse(JSON.stringify(this.fieldConfigs));
      this.dialogVisible = true;
    },
    
    // Save Settings
    saveFieldSettings() {
      this.fieldConfigs = JSON.parse(JSON.stringify(this.tempFieldConfigs));
      this.dialogVisible = false;
      this.$message.success('字段配置已更新');
    },
    
    // Reset Settings to Default (Original keys, all visible)
    resetFieldSettings() {
      if (!this.jsonData || this.jsonData.length === 0) return;
      
      // Re-initialize from original keys
      const keys = Object.keys(this.jsonData[0]);
      // Detect hidden fields again if possible, or just default visible
      // Since we don't store hiddenHeaders separately, we might lose that info if we just reset
      // So we should try to preserve isHiddenInExcel from current fieldConfigs if key matches
      
      const currentConfigsMap = {};
      this.fieldConfigs.forEach(fc => {
        currentConfigsMap[fc.key] = fc.isHiddenInExcel;
      });

      this.tempFieldConfigs = keys.map(key => ({
        key: key,
        alias: key,
        visible: true,
        isHiddenInExcel: currentConfigsMap[key] || false
      }));
      
      this.$message.info('已重置为默认设置，请点击确定保存');
    },

    // Field Operations
    openFieldOperations(field) {
      this.currentOpField = field;
      this.customCode = '';
      this.opDialogVisible = true;
    },

    deduplicateData() {
       if (!this.currentOpField || !this.jsonData) return;
       const key = this.currentOpField.key;
       
       const seen = new Set();
       const newData = this.jsonData.filter(item => {
         const val = item[key];
         if (seen.has(val)) {
           return false;
         }
         seen.add(val);
         return true;
       });
       
       const removedCount = this.jsonData.length - newData.length;
       this.jsonData = newData;
       this.$message.success(`去重完成，已移除 ${removedCount} 条重复数据`);
       this.opDialogVisible = false;
    },

    removeEmptyRows() {
      if (!this.currentOpField || !this.jsonData) return;
      const key = this.currentOpField.key;
      
      const newData = this.jsonData.filter(item => {
        const val = item[key];
        return val !== null && val !== undefined && val !== '';
      });
      
      const removedCount = this.jsonData.length - newData.length;
      this.jsonData = newData;
      this.$message.success(`已移除 ${removedCount} 条空数据`);
      this.opDialogVisible = false;
    },

    applyCustomCode() {
      if (!this.currentOpField || !this.jsonData || !this.customCode) return;
      const key = this.currentOpField.key;

      try {
        // Create a function from the code
        // eslint-disable-next-line no-new-func
        const transformFn = new Function('value', 'row', this.customCode);
        
        let successCount = 0;
        const newData = this.jsonData.map(item => {
          try {
            const originalVal = item[key];
            const newVal = transformFn(originalVal, item);
            if (newVal !== originalVal) {
                successCount++;
            }
            return {
              ...item,
              [key]: newVal
            };
          } catch (e) {
            return item;
          }
        });
        
        this.jsonData = newData;
        this.$message.success(`代码执行成功，${successCount} 条数据发生变化`);
        this.opDialogVisible = false;
      } catch (e) {
        this.$message.error('代码执行出错: ' + e.message);
      }
    },

    updateJsonString() {
      this.jsonString = JSON.stringify(this.processedData, null, 2);
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.processFile(file);
      }
      e.target.value = '';
    },

    handleDrop(e) {
      const file = e.dataTransfer.files[0];
      if (file) {
        this.processFile(file);
      }
    },

    async processFile(file) {
      this.loading = true;
      try {
        const name = file.name.split('.').slice(0, -1).join('.');
        const extension = file.name.split('.').pop().toLowerCase();
        
        // Handle JSON file
        if (extension === 'json') {
           const reader = new FileReader();
           reader.onload = (e) => {
             try {
               const json = JSON.parse(e.target.result);
               if (Array.isArray(json)) {
                 this.handleDataLoaded(json, name, []);
                 this.activeTab = 'json';
               } else {
                 this.$message.error('JSON 文件必须包含对象数组');
               }
             } catch (err) {
               this.$message.error('无效的 JSON 文件');
             }
             this.loading = false;
           };
           reader.onerror = () => {
             this.$message.error('读取文件失败');
             this.loading = false;
           };
           reader.readAsText(file);
           return;
        }

        // Handle Excel / CSV file
        // readExcel uses XLSX.read which handles csv if content is array buffer
        const { json, hiddenHeaders } = await readExcel(file);
        this.handleDataLoaded(json, name, hiddenHeaders);
        this.activeTab = 'table'; // Default to table for spreadsheet formats
      } catch (error) {
        console.error(error);
        this.$message.error('解析文件失败');
      } finally {
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.loading = false;
        }
      }
    },

    handleDataLoaded(json, fileName, hiddenHeaders = []) {
        this.jsonData = json;
        
        if (json && json.length > 0) {
          const keys = Object.keys(json[0]);
          this.fieldConfigs = keys.map(key => ({
            key: key,
            alias: key,
            visible: !hiddenHeaders.includes(key),
            isHiddenInExcel: hiddenHeaders.includes(key)
          }));
        } else {
          this.fieldConfigs = [];
        }

        this.fileName = fileName || 'data';
        this.$message.success('转换成功！');
    },

    copyJson() {
      if (!this.jsonString) return;
      
      const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
             this.$message.success('已复制到剪贴板！');
          } else {
             this.$message.error('复制失败，请手动复制');
          }
        } catch (err) {
          this.$message.error('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(this.jsonString).then(() => {
          this.$message.success('已复制到剪贴板！');
        }).catch(() => {
          fallbackCopy(this.jsonString);
        });
      } else {
        fallbackCopy(this.jsonString);
      }
    },

    downloadJson() {
      if (!this.jsonString) return;
      try {
        JSON.parse(this.jsonString);
      } catch (e) {
        this.$confirm('JSON 内容无效，是否仍要下载？', '警告', {
          confirmButtonText: '是',
          cancelButtonText: '否',
          type: 'warning'
        }).then(() => {
           this.saveFile();
        }).catch(() => {});
        return;
      }
      this.saveFile();
    },

    saveFile() {
      const blob = new Blob([this.jsonString], { type: 'application/json;charset=utf-8' });
      FileSaver.saveAs(blob, `${this.fileName}.json`);
    },

    exportToExcel() {
      if (!this.processedData || this.processedData.length === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }
      try {
        exportExcel(this.processedData, `${this.fileName}.xlsx`);
        this.$message.success('导出 Excel 成功');
      } catch (error) {
        console.error(error);
        this.$message.error('导出 Excel 失败');
      }
    },

    exportToCSV() {
      if (!this.processedData || this.processedData.length === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }
      try {
        exportCSV(this.processedData, `${this.fileName}.csv`);
        this.$message.success('导出 CSV 成功');
      } catch (error) {
        console.error(error);
        this.$message.error('导出 CSV 失败');
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #2c3e50;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.el-header {
  background-color: #ffffff;
  color: #333;
  line-height: 60px;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
  }

  .logo {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: #2563EB;
    
    i {
      font-size: 24px;
      margin-right: 8px;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .el-button {
      color: #606266;
      font-size: 14px;
      
      &:hover {
        color: #2563EB;
      }
      
      &[class*="el-icon-refresh"] {
        color: #F56C6C;
        &:hover {
          color: #f78989;
        }
      }
    }
  }
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 0;
  height: calc(100vh - 80px);
}

.fullscreen-upload-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 140px);
  cursor: pointer;
  position: relative;
  background-color: #ffffff;
  border: 2px dashed #e8e8e8;
  border-radius: 12px;
  transition: all .3s;

  &:hover {
    border-color: #2563EB;
    background-color: #f8faff;
    
    .upload-content {
      transform: translateY(-5px);
    }
  }

  .upload-content {
    text-align: center;
    transition: all .3s;
  }

  .el-icon-upload-filled {
    font-size: 64px;
    color: #409EFF;
    margin-bottom: 16px;
  }
  
  .el-icon-upload {
    font-size: 64px;
    color: #409EFF;
    margin-bottom: 16px;
  }

  .upload-text {
    h3 {
      margin: 0 0 8px;
      font-size: 20px;
      color: #333;
    }
    p {
      margin: 0;
      font-size: 16px;
      color: #999;
    }
  }
}

.result-card {
  border: none;
  background: transparent;
  box-shadow: none !important;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  flex-wrap: wrap;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.left-tools, .right-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-item {
  display: flex;
  align-items: center;
}

.info-text {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
}

.json-editor-container {
  padding: 0;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0; /* Important for flex child */
}

.line-count-info {
  position: absolute;
  bottom: 10px;
  right: 20px;
  color: #858585;
  font-size: 12px;
  z-index: 10;
  background-color: rgba(30, 30, 30, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
}

/* Custom dark theme for textarea */
.dark-textarea {
  height: 100%;
  
  ::v-deep .el-textarea__inner {
    background-color: #1e1e1e;
    color: #d4d4d4;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    line-height: 1.6;
    border: none;
    border-radius: 0;
    padding: 20px;
    font-size: 14px;
    height: 100% !important;
    min-height: auto !important;

    &:focus {
      box-shadow: none;
    }
  }
}

/* Tabs Styling */
::v-deep .el-tabs--border-card {
  border: none;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;

  .el-tabs__header {
    background-color: #ffffff;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    
    .el-tabs__item {
      height: 48px;
      line-height: 48px;
      font-weight: 500;
      
      &.is-active {
        color: #2563EB;
        background-color: #fff;
        border-right-color: transparent;
        border-left-color: transparent;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #2563EB;
        }
      }
    }
  }

  .el-tabs__content {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 0; /* Important */
    
    .el-tab-pane {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
}

.full-height-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-info-bar {
  padding: 10px 20px 0;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  flex-shrink: 0;
}

.table-container {
  padding: 20px;
  background-color: #fff;
  flex: 1;
  height: 0; /* Important for flex child to scroll */
  box-sizing: border-box;
}

/* Dialog Customization */
::v-deep .field-settings-dialog {
  border-radius: 8px;
  
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    .el-dialog__title {
      font-weight: 600;
      font-size: 16px;
    }
  }
  
  .el-dialog__body {
    padding: 20px 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
  }
}

.op-list {
  .op-item {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 10px;
      font-size: 14px;
      color: #333;
    }
    
    .code-hint {
      font-size: 12px;
      color: #999;
      margin: 0 0 5px;
    }
  }
  
  .op-actions {
    display: flex;
    gap: 10px;
  }
}
</style>
