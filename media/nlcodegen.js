(function () {
    // Get a reference to the VS Code API object
    const vscode = acquireVsCodeApi();
    let currentLanguage = document.querySelector('#language').value;
    let currentTab = 'generate';
    let generatedCode = '';
    let historyItems = [];

    // DOM elements
    const description = document.querySelector('#description');
    const language = document.querySelector('#language');
    const template = document.querySelector('#template');
    const includeContext = document.querySelector('#include-context');
    const btnGenerate = document.querySelector('#btn-generate');
    const resultContainer = document.querySelector('#result-container');
    const generatedCodeElement = document.querySelector('#generated-code');
    const btnInsert = document.querySelector('#btn-insert');
    const btnCopy = document.querySelector('#btn-copy');
    const btnRefine = document.querySelector('#btn-refine');
    const historyContainer = document.querySelector('#history-container');
    const btnClearHistory = document.querySelector('#btn-clear-history');

    // Tab navigation
    document.querySelector('#tab-generate').addEventListener('click', () => switchTab('generate'));
    document.querySelector('#tab-history').addEventListener('click', () => {
        switchTab('history');
        loadHistory();
    });

    function switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.id === `tab-${tabId}`);
        });

        // Update panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabId}`);
        });

        currentTab = tabId;
    }

    // Request the list of supported languages
    vscode.postMessage({ command: 'getLanguages' });

    // Generate button click handler
    btnGenerate.addEventListener('click', () => {
        if (!description.value.trim()) {
            return;
        }

        btnGenerate.disabled = true;
        btnGenerate.textContent = 'Generating...';
        resultContainer.classList.add('hidden');

        const options = {
            language: language.value,
            includeEditorContext: includeContext.checked,
            modelTemplate: template.value
        };

        vscode.postMessage({
            command: 'generate',
            description: description.value,
            options
        });
    });

    // Insert button click handler
    btnInsert.addEventListener('click', () => {
        if (generatedCode) {
            vscode.postMessage({
                command: 'insert',
                code: generatedCode
            });
        }
    });

    // Copy button click handler
    btnCopy.addEventListener('click', () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode)
                .then(() => {
                    const originalText = btnCopy.innerHTML;
                    btnCopy.innerHTML = '<i class="codicon codicon-check"></i> Copied!';
                    setTimeout(() => {
                        btnCopy.innerHTML = originalText;
                    }, 2000);
                });
        }
    });

    // Refine button click handler
    btnRefine.addEventListener('click', () => {
        if (generatedCode) {
            description.value += "\n\nRefine the code above to: ";
            switchTab('generate');
            description.focus();
            description.scrollIntoView();
        }
    });

    // Clear history button click handler
    btnClearHistory.addEventListener('click', () => {
        const confirmClear = confirm('Are you sure you want to clear all history items?');
        if (confirmClear) {
            vscode.postMessage({ command: 'clearHistory' });
            historyItems = [];
            renderHistory();
        }
    });

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'generationResult':
                handleGenerationResult(message.result);
                break;

            case 'languages':
                handleLanguages(message.current, message.options);
                break;

            case 'historyItems':
                handleHistoryItems(message.items);
                break;

            case 'showHistory':
                switchTab('history');
                loadHistory();
                break;

            case 'showGenerated':
                handleGenerationResult(message.result);
                switchTab('generate');
                break;
        }
    });

    function handleGenerationResult(result) {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = '<i class="codicon codicon-wand"></i> Generate';

        if (result.success && result.code) {
            generatedCode = result.code;
            generatedCodeElement.textContent = result.code;
            resultContainer.classList.remove('hidden');

            // Save to history
            vscode.postMessage({
                command: 'saveToHistory',
                description: result.description,
                code: result.code,
                language: result.language
            });
        } else {
            generatedCode = '';
            const errorMessage = result.error || 'Unknown error occurred';
            vscode.postMessage({
                command: 'error',
                message: errorMessage
            });
        }
    }

    function handleLanguages(current, options) {
        // Update the language dropdown
        currentLanguage = current;
        const languageSelect = document.getElementById('language');
        languageSelect.innerHTML = '';

        options.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            option.selected = lang === currentLanguage;
            languageSelect.appendChild(option);
        });
    }

    function handleHistoryItems(items) {
        historyItems = items;
        renderHistory();
    }

    function loadHistory() {
        vscode.postMessage({ command: 'getHistory' });
    }

    function renderHistory() {
        if (historyItems.length === 0) {
            historyContainer.innerHTML = '<div class="placeholder">No history items found.</div>';
            return;
        }

        historyContainer.innerHTML = '';

        historyItems.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            // Create header with language tag and timestamp
            const header = document.createElement('div');
            header.className = 'history-item-header';

            const languageTag = document.createElement('span');
            languageTag.className = 'language-tag';
            languageTag.textContent = item.language;

            const timestamp = document.createElement('span');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date(item.timestamp).toLocaleString();

            header.appendChild(languageTag);
            header.appendChild(timestamp);

            // Create description section
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'history-item-description';
            descriptionDiv.textContent = item.description;

            // Create code section
            const codeDiv = document.createElement('div');
            codeDiv.className = 'history-item-code';

            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = item.code;
            pre.appendChild(code);
            codeDiv.appendChild(pre);

            // Create action buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-item-actions';

            const insertBtn = document.createElement('button');
            insertBtn.className = 'action-button';
            insertBtn.innerHTML = '<i class="codicon codicon-insert"></i>';
            insertBtn.title = 'Insert Code';
            insertBtn.onclick = function () {
                vscode.postMessage({
                    command: 'insert',
                    code: item.code
                });
            };

            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-button';
            copyBtn.innerHTML = '<i class="codicon codicon-copy"></i>';
            copyBtn.title = 'Copy Code';
            copyBtn.onclick = function () {
                navigator.clipboard.writeText(item.code)
                    .then(() => {
                        const originalHtml = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i class="codicon codicon-check"></i>';
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHtml;
                        }, 2000);
                    });
            };

            const reuseBtn = document.createElement('button');
            reuseBtn.className = 'action-button';
            reuseBtn.innerHTML = '<i class="codicon codicon-refresh"></i>';
            reuseBtn.title = 'Reuse Prompt';
            reuseBtn.onclick = function () {
                description.value = item.description;
                language.value = item.language;
                switchTab('generate');
            };

            actionsDiv.appendChild(insertBtn);
            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(reuseBtn);
            codeDiv.appendChild(actionsDiv);

            // Assemble the history item
            historyItem.appendChild(header);
            historyItem.appendChild(descriptionDiv);
            historyItem.appendChild(codeDiv);

            historyContainer.appendChild(historyItem);
        });
    }
})();
