import * as XLSX from 'xlsx';

export const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    // If CSV, try to read as text first to handle encoding manually if needed
    if (file.name.toLowerCase().endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Try to detect encoding or default to UTF-8, but let's try reading as binary string
                // and let XLSX handle it with codepage option if possible.
                // Actually, reading as ArrayBuffer is best for XLSX to detect.
                // But for GBK, sometimes we need to hint.
                // Let's stick to ArrayBuffer but try to parse with GBK if UTF-8 seems wrong?
                // Or simply: read as ArrayBuffer, pass to XLSX.read.
                // If it's GBK, XLSX might not auto-detect perfectly from ArrayBuffer without 'codepage'.
                // But we don't know for sure.
                
                // Better strategy: Read as text with 'GBK' (common Chinese encoding) if it's CSV,
                // BUT only if we can't be sure it's UTF-8.
                // Since we can't easily detect, let's try to read as ArrayBuffer first.
                // If we really want to solve "Chinese garbled", we might need to ask user or try both.
                
                // Let's try a different approach:
                // Use FileReader to read as text. If we use 'GBK', it might fix Chinese but break UTF-8.
                // Let's try to use XLSX.read with 'codepage: 936' (GBK) as an option?
                
                const data = e.target.result;
                // Try reading with default (which handles UTF-8 BOM or standard UTF-8)
                let workbook = XLSX.read(data, { type: 'array' });
                
                // Check if the first cell of first sheet looks like garbage?
                // Hard to tell.
                
                // Let's just assume if it's CSV, we might need to handle it.
                // But wait, the user says "Chinese characters are garbled".
                // This usually means it was GBK/GB2312 and read as UTF-8 (or ISO-8859-1).
                
                // Let's try to read as string with 'gbk' encoding using FileReader
                // This is a browser feature.
                // But we are in 'readExcel'.
                // Let's return a special structure or handle it inside.
                
                // Let's use a trick: Read as text with 'GBK'. If it contains �, it might be wrong (or right?).
                // Actually, let's try to read as ArrayBuffer, then decode.
                
                // Revised strategy for CSV:
                // 1. Read as ArrayBuffer.
                // 2. Decode as UTF-8. If it has many replacement chars, try GBK.
                // This requires TextDecoder.
                
                const uint8Array = new Uint8Array(data);
                let text = '';
                let isUtf8 = true;
                try {
                    // Try UTF-8 first
                    const decoder = new TextDecoder('utf-8', { fatal: true });
                    text = decoder.decode(uint8Array);
                } catch (e) {
                    isUtf8 = false;
                }

                if (!isUtf8) {
                     // Try GBK
                     try {
                        const decoder = new TextDecoder('gbk');
                        text = decoder.decode(uint8Array);
                        // Now parse the CSV text
                        workbook = XLSX.read(text, { type: 'string' });
                     } catch (e) {
                        // Fallback to original array buffer read if GBK fails or not supported
                        workbook = XLSX.read(data, { type: 'array' });
                     }
                } else {
                    // It is valid UTF-8, use the array buffer or the text
                     workbook = XLSX.read(data, { type: 'array' });
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve({ json, hiddenHeaders: [] }); // CSV has no hidden columns
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
        return;
    }

    // Standard Excel handling
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // Detect hidden columns
        const hiddenHeaders = [];
        if (worksheet['!cols']) {
          // Get range to determine valid columns
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          // Iterate over columns in the first row (headers)
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
              const colInfo = worksheet['!cols'][C];
              if (colInfo && (colInfo.hidden || colInfo.width === 0)) {
                hiddenHeaders.push(cell.v);
              }
            }
          }
        }

        resolve({ json, hiddenHeaders });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const exportExcel = (data, fileName = 'export.xlsx') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, fileName);
};

export const exportCSV = (data, fileName = 'export.csv') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, fileName, { bookType: 'csv' });
};
