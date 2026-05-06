var state = {
    cacheCode: 'GC40',
    cacheName: 'The Original Stash Tribute',
    paramMethod: 'range',
    paramRange: 'A-B',
    paramCustom: '',
    paramValues: {},
    paramComments: {},
    waypointCount: 1,
    waypoints: []
};

function init() {
    populateParamRangeSelect();
    setupEventListeners();
    updateParamInputs();
    updateWaypoints();
    
    var urlParams = new URLSearchParams(window.location.search);
    var loadUrl = urlParams.get('load');
    if (loadUrl) {
        document.getElementById('urlInput').value = loadUrl;
        loadFromUrl();
    }
}

function populateParamRangeSelect() {
    var select = document.getElementById('paramRangeSelect');
    for (var i = 0; i < 26; i++) {
        var option = document.createElement('option');
        var end = String.fromCharCode(65 + i);
        option.value = 'A-' + end;
        option.textContent = 'A-' + end;
        select.appendChild(option);
    }
    select.value = state.paramRange;
}

function getCurrentParams() {
    if (state.paramMethod === 'custom') {
        var paramString = state.paramCustom.trim();
        if (!paramString) return [];
        
        var params = paramString.split(',').map(function(p) {
            return p.trim().toUpperCase();
        }).filter(function(p) {
            return p.length === 1 && p >= 'A' && p <= 'Z';
        });
        
        var unique = [];
        for (var i = 0; i < params.length; i++) {
            if (unique.indexOf(params[i]) === -1) {
                unique.push(params[i]);
            }
        }
        
        return unique;
    } else {
        var endChar = state.paramRange.split('-')[1];
        var count = endChar.charCodeAt(0) - 64;
        var params = [];
        for (var i = 0; i < count; i++) {
            params.push(String.fromCharCode(65 + i));
        }
        return params;
    }
}

function handleParamMethodChange(e) {
    state.paramMethod = e.target.value;
    
    if (state.paramMethod === 'range') {
        document.getElementById('rangeGroup').style.display = 'block';
        document.getElementById('customGroup').style.display = 'none';
    } else {
        document.getElementById('rangeGroup').style.display = 'none';
        document.getElementById('customGroup').style.display = 'block';
    }
    
    updateParamInputs();
    updateAllWaypointCoordinates();
}

function updateParamInputs() {
    var container = document.getElementById('paramInputs');
    container.innerHTML = '';
    
    var params = getCurrentParams();
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        var div = document.createElement('div');
        div.style.gridColumn = 'span 1';
        
        var label = document.createElement('label');
        label.className = 'label';
        label.textContent = param + ':';
        
        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'input';
        input.placeholder = 'Value';
        input.dataset.param = param;
        input.value = state.paramValues[param] || '';
        input.addEventListener('input', handleParamInput);
        input.style.marginBottom = '0.5rem';
        
        var commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.className = 'input';
        commentInput.placeholder = 'Note (optional)';
        commentInput.dataset.param = param;
        commentInput.value = state.paramComments ? (state.paramComments[param] || '') : '';
        commentInput.addEventListener('input', handleCommentInput);
        commentInput.style.fontSize = '0.875rem';
        commentInput.style.backgroundColor = '#f9fafb';
        
        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(commentInput);
        container.appendChild(div);
    }
}

function updateWaypoints() {
    var container = document.getElementById('waypointsContainer');
    container.innerHTML = '';
    
    while (state.waypoints.length < state.waypointCount) {
        state.waypoints.push({
            northSouth: 'N',
            eastWest: 'E',
            coordValues: ['','','','','','','','','','','','','','',''],
            collapsedValues: ['','','','','',''],
            collapsed: false
        });
    }
    
    if (state.waypoints.length > state.waypointCount) {
        state.waypoints = state.waypoints.slice(0, state.waypointCount);
    }
    
    for (var wpIndex = 0; wpIndex < state.waypointCount; wpIndex++) {
        var wpCard = createWaypointCard(wpIndex);
        container.appendChild(wpCard);
    }
}

function createWaypointCard(wpIndex) {
    var card = document.createElement('div');
    card.className = 'waypoint-card';

    var header = document.createElement('div');
    header.className = 'waypoint-header';

    var title = document.createElement('div');
    title.className = 'waypoint-title';
    title.textContent = 'Waypoint ' + (wpIndex + 1);
    header.appendChild(title);

    var collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-toggle-btn';
    collapseBtn.textContent = state.waypoints[wpIndex].collapsed ? '▼ Expand' : '▲ Collapse';
    collapseBtn.onclick = (function(idx) { return function() { toggleWaypointCollapse(idx); }; })(wpIndex);
    header.appendChild(collapseBtn);

    card.appendChild(header);

    var resultBox = document.createElement('div');
    resultBox.className = 'waypoint-result';

    var resultLabel = document.createElement('div');
    resultLabel.className = 'waypoint-result-label';
    resultLabel.textContent = 'Calculated Coordinate:';

    var resultValue = document.createElement('div');
    resultValue.className = 'waypoint-result-value';
    resultValue.id = 'wpResult' + wpIndex;
    resultValue.textContent = 'N ° . E ° .';

    resultBox.appendChild(resultLabel);
    resultBox.appendChild(resultValue);

    var mapBtnRow = document.createElement('div');
    mapBtnRow.style.marginTop = '0.5rem';
    var mapBtn = document.createElement('button');
    mapBtn.className = 'map-toggle-btn';
    mapBtn.id = 'wpMapToggle' + wpIndex;
    mapBtn.textContent = '📍 Show on Map';
    mapBtn.onclick = (function(idx) { return function() { toggleMap(idx); }; })(wpIndex);
    mapBtnRow.appendChild(mapBtn);
    resultBox.appendChild(mapBtnRow);

    card.appendChild(resultBox);

    var mapContainer = document.createElement('div');
    mapContainer.id = 'wpMapContainer' + wpIndex;
    mapContainer.className = 'map-container';
    mapContainer.style.display = 'none';
    var mapIframe = document.createElement('iframe');
    mapIframe.id = 'wpMapIframe' + wpIndex;
    mapIframe.className = 'map-iframe';
    mapIframe.frameBorder = '0';
    mapContainer.appendChild(mapIframe);
    card.appendChild(mapContainer);

    var helpText = document.createElement('p');
    helpText.className = 'help-text';
    helpText.textContent = state.waypoints[wpIndex].collapsed
        ? 'Grouped mode: enter full values or formulas per field (e.g., A+B). Format: N DD° MM.MMM E DDD° MM.MMM'
        : 'Digit mode: enter one digit or formula per cell (e.g., A+B*2). Format: N DD° MM.MMM E DDD° MM.MMM';
    card.appendChild(helpText);

    if (state.waypoints[wpIndex].collapsed) {
        createCollapsedCoordRows(wpIndex, card);
    } else {
        createExpandedCoordRows(wpIndex, card);
    }

    updateWaypointCoordinate(wpIndex);

    return card;
}

function createExpandedCoordRows(wpIndex, card) {
    var coordRow1 = document.createElement('div');
    coordRow1.className = 'coord-row';

    var toggleNS = document.createElement('button');
    toggleNS.className = 'toggle-btn';
    toggleNS.textContent = state.waypoints[wpIndex].northSouth;
    toggleNS.onclick = function() { toggleDirection(wpIndex, 'northSouth'); };
    coordRow1.appendChild(toggleNS);

    for (var i = 0; i < 7; i++) {
        if (i === 2) {
            var sep = document.createElement('span');
            sep.className = 'separator';
            sep.textContent = '°';
            coordRow1.appendChild(sep);
        } else if (i === 4) {
            var sep = document.createElement('span');
            sep.className = 'separator';
            sep.textContent = '.';
            coordRow1.appendChild(sep);
        }
        var input = document.createElement('input');
        input.className = 'coord-input';
        input.dataset.wpindex = wpIndex;
        input.dataset.index = i;
        input.value = state.waypoints[wpIndex].coordValues[i] || '';
        input.placeholder = ['5','0','0','0','0','0','0'][i];
        input.addEventListener('input', handleCoordInput);
        coordRow1.appendChild(input);
    }
    card.appendChild(coordRow1);

    var coordRow2 = document.createElement('div');
    coordRow2.className = 'coord-row';

    var toggleEW = document.createElement('button');
    toggleEW.className = 'toggle-btn';
    toggleEW.textContent = state.waypoints[wpIndex].eastWest;
    toggleEW.onclick = function() { toggleDirection(wpIndex, 'eastWest'); };
    coordRow2.appendChild(toggleEW);

    for (var i = 7; i < 15; i++) {
        if (i === 10) {
            var sep = document.createElement('span');
            sep.className = 'separator';
            sep.textContent = '°';
            coordRow2.appendChild(sep);
        } else if (i === 12) {
            var sep = document.createElement('span');
            sep.className = 'separator';
            sep.textContent = '.';
            coordRow2.appendChild(sep);
        }
        var input = document.createElement('input');
        input.className = 'coord-input';
        input.dataset.wpindex = wpIndex;
        input.dataset.index = i;
        input.value = state.waypoints[wpIndex].coordValues[i] || '';
        input.placeholder = ['0','0','5','0','0','0','0','0'][i-7];
        input.addEventListener('input', handleCoordInput);
        coordRow2.appendChild(input);
    }
    card.appendChild(coordRow2);
}

function createCollapsedCoordRows(wpIndex, card) {
    var wp = state.waypoints[wpIndex];
    var cv = wp.collapsedValues || ['','','','','',''];

    function makeGroupedInput(cindex, placeholder) {
        var inp = document.createElement('input');
        inp.className = 'coord-input collapsed-input';
        inp.dataset.wpindex = wpIndex;
        inp.dataset.cindex = cindex;
        inp.value = cv[cindex] || '';
        inp.placeholder = placeholder;
        inp.addEventListener('input', handleCollapsedCoordInput);
        return inp;
    }

    var coordRow1 = document.createElement('div');
    coordRow1.className = 'coord-row';
    var toggleNS = document.createElement('button');
    toggleNS.className = 'toggle-btn';
    toggleNS.textContent = wp.northSouth;
    toggleNS.onclick = function() { toggleDirection(wpIndex, 'northSouth'); };
    coordRow1.appendChild(toggleNS);
    coordRow1.appendChild(makeGroupedInput(0, 'DD'));
    var s1 = document.createElement('span'); s1.className = 'separator'; s1.textContent = '°';
    coordRow1.appendChild(s1);
    coordRow1.appendChild(makeGroupedInput(1, 'MM'));
    var s2 = document.createElement('span'); s2.className = 'separator'; s2.textContent = '.';
    coordRow1.appendChild(s2);
    coordRow1.appendChild(makeGroupedInput(2, 'MMM'));
    card.appendChild(coordRow1);

    var coordRow2 = document.createElement('div');
    coordRow2.className = 'coord-row';
    var toggleEW = document.createElement('button');
    toggleEW.className = 'toggle-btn';
    toggleEW.textContent = wp.eastWest;
    toggleEW.onclick = function() { toggleDirection(wpIndex, 'eastWest'); };
    coordRow2.appendChild(toggleEW);
    coordRow2.appendChild(makeGroupedInput(3, 'DDD'));
    var s3 = document.createElement('span'); s3.className = 'separator'; s3.textContent = '°';
    coordRow2.appendChild(s3);
    coordRow2.appendChild(makeGroupedInput(4, 'MM'));
    var s4 = document.createElement('span'); s4.className = 'separator'; s4.textContent = '.';
    coordRow2.appendChild(s4);
    coordRow2.appendChild(makeGroupedInput(5, 'MMM'));
    card.appendChild(coordRow2);
}

function handleCollapsedCoordInput(e) {
    var wpIndex = parseInt(e.target.dataset.wpindex);
    var cindex = parseInt(e.target.dataset.cindex);
    state.waypoints[wpIndex].collapsedValues[cindex] = e.target.value;
    updateWaypointCoordinate(wpIndex);
}

function toggleWaypointCollapse(wpIndex) {
    state.waypoints[wpIndex].collapsed = !state.waypoints[wpIndex].collapsed;
    updateWaypoints();
}

function toggleMap(wpIndex) {
    var container = document.getElementById('wpMapContainer' + wpIndex);
    var btn = document.getElementById('wpMapToggle' + wpIndex);
    var iframe = document.getElementById('wpMapIframe' + wpIndex);
    if (container.style.display === 'none') {
        var coord = document.getElementById('wpResult' + wpIndex).textContent;
        iframe.src = 'location.html?coord=' + encodeURIComponent(coord);
        container.style.display = 'block';
        btn.textContent = '🗺️ Hide Map';
    } else {
        container.style.display = 'none';
        btn.textContent = '📍 Show on Map';
    }
}

function evaluateFormula(formula) {
    if (!formula || formula.trim() === '') return '';
    if (!isNaN(formula)) return formula;
    
    var expression = formula;
    for (var param in state.paramValues) {
        if (state.paramValues.hasOwnProperty(param)) {
            var value = state.paramValues[param];
            if (value !== '') {
                expression = expression.replace(new RegExp(param, 'g'), value);
            }
        }
    }
    
    try {
        var result = eval(expression);
        return Math.floor(result).toString();
    } catch (e) {
        return '?';
    }
}

function updateWaypointCoordinate(wpIndex) {
    var wp = state.waypoints[wpIndex];
    var coord;

    if (wp.collapsed) {
        var cv = wp.collapsedValues || ['','','','','',''];
        coord = wp.northSouth + ' ' + (evaluateFormula(cv[0]) || '') + '° ' +
                (evaluateFormula(cv[1]) || '') + '.' + (evaluateFormula(cv[2]) || '') + ' ' +
                wp.eastWest + ' ' + (evaluateFormula(cv[3]) || '') + '° ' +
                (evaluateFormula(cv[4]) || '') + '.' + (evaluateFormula(cv[5]) || '');
    } else {
        var vals = [];
        for (var i = 0; i < wp.coordValues.length; i++) {
            vals.push(evaluateFormula(wp.coordValues[i]));
        }
        coord = wp.northSouth + ' ' + vals[0] + vals[1] + '° ' + vals[2] + vals[3] + '.' + vals[4] + vals[5] + vals[6] + ' ' + wp.eastWest + ' ' + vals[7] + vals[8] + vals[9] + '° ' + vals[10] + vals[11] + '.' + vals[12] + vals[13] + vals[14];
    }

    var resultElement = document.getElementById('wpResult' + wpIndex);
    if (resultElement) {
        resultElement.textContent = coord;
    }
}

function updateAllWaypointCoordinates() {
    for (var i = 0; i < state.waypoints.length; i++) {
        updateWaypointCoordinate(i);
    }
}

function handleParamRangeChange(e) {
    state.paramRange = e.target.value;
    var oldParams = Object.keys(state.paramValues);
    var newParams = getCurrentParams();
    
    var newParamValues = {};
    var newParamComments = {};
    
    for (var i = 0; i < newParams.length; i++) {
        var param = newParams[i];
        if (state.paramValues[param] !== undefined) {
            newParamValues[param] = state.paramValues[param];
        }
        if (state.paramComments[param] !== undefined) {
            newParamComments[param] = state.paramComments[param];
        }
    }
    
    state.paramValues = newParamValues;
    state.paramComments = newParamComments;
    updateParamInputs();
    updateAllWaypointCoordinates();
}

function handleParamCustomChange(e) {
    state.paramCustom = e.target.value;
    var oldParams = Object.keys(state.paramValues);
    var newParams = getCurrentParams();
    
    var newParamValues = {};
    var newParamComments = {};
    
    for (var i = 0; i < newParams.length; i++) {
        var param = newParams[i];
        if (state.paramValues[param] !== undefined) {
            newParamValues[param] = state.paramValues[param];
        }
        if (state.paramComments[param] !== undefined) {
            newParamComments[param] = state.paramComments[param];
        }
    }
    
    state.paramValues = newParamValues;
    state.paramComments = newParamComments;
    updateParamInputs();
    updateAllWaypointCoordinates();
}

function handleParamInput(e) {
    var param = e.target.dataset.param;
    state.paramValues[param] = e.target.value;
    updateAllWaypointCoordinates();
}

function handleCommentInput(e) {
    var param = e.target.dataset.param;
    if (!state.paramComments) {
        state.paramComments = {};
    }
    state.paramComments[param] = e.target.value;
}

function handleCoordInput(e) {
    var wpIndex = parseInt(e.target.dataset.wpindex);
    var index = parseInt(e.target.dataset.index);
    state.waypoints[wpIndex].coordValues[index] = e.target.value;
    updateWaypointCoordinate(wpIndex);
}

function toggleDirection(wpIndex, type) {
    if (type === 'northSouth') {
        state.waypoints[wpIndex].northSouth = state.waypoints[wpIndex].northSouth === 'N' ? 'S' : 'N';
    } else {
        state.waypoints[wpIndex].eastWest = state.waypoints[wpIndex].eastWest === 'E' ? 'W' : 'E';
    }
    updateWaypoints();
}

function handleWaypointCountChange() {
    var count = parseInt(document.getElementById('waypointCount').value);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 50) count = 50;
    state.waypointCount = count;
    document.getElementById('waypointCount').value = count;
    updateWaypoints();
}

function saveFormula() {
    var cacheCode = document.getElementById('cacheCode').value.trim();
    var cacheName = document.getElementById('cacheName').value.trim();
    var saveParamValues = document.getElementById('saveParamValues').checked;
    
    var data = {
        cacheCode: cacheCode,
        cacheName: cacheName,
        paramMethod: state.paramMethod,
        paramRange: state.paramRange,
        paramCustom: state.paramCustom,
        waypointCount: state.waypointCount,
        waypoints: state.waypoints,
        paramComments: state.paramComments
    };
    
    if (saveParamValues) {
        data.paramValues = state.paramValues;
    }
    
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    
    var filename;
    if (cacheCode) {
        filename = cacheCode + '.json';
    } else {
        var timestamp = new Date().toISOString().split('T')[0];
        filename = 'GC_multi_cache_' + timestamp + '.json';
    }
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadFormula(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var data = JSON.parse(event.target.result);
            applyLoadedData(data);
            alert('Formula loaded successfully!');
        } catch (error) {
            alert('Error loading file: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function saveToBrowser() {
    var cacheCode = document.getElementById('cacheCode').value.trim();
    var cacheName = document.getElementById('cacheName').value.trim();
    
    if (!cacheCode) {
        alert('Please enter a Geocache Code before saving to browser');
        return;
    }
    
    var saveParamValues = document.getElementById('saveParamValues').checked;
    
    var data = {
        cacheCode: cacheCode,
        cacheName: cacheName,
        paramMethod: state.paramMethod,
        paramRange: state.paramRange,
        paramCustom: state.paramCustom,
        waypointCount: state.waypointCount,
        waypoints: state.waypoints,
        paramComments: state.paramComments,
        savedAt: new Date().toISOString()
    };
    
    if (saveParamValues) {
        data.paramValues = state.paramValues;
    }
    
    try {
        var storageKey = 'gc_multi_' + cacheCode;
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        var savedList = localStorage.getItem('gc_multi_list');
        var list = savedList ? JSON.parse(savedList) : [];
        if (list.indexOf(cacheCode) === -1) {
            list.push(cacheCode);
            localStorage.setItem('gc_multi_list', JSON.stringify(list));
        }
        
        alert('Formula saved to browser storage as "' + cacheCode + '"');
    } catch (e) {
        alert('Error saving to browser: ' + e.message);
    }
}

function loadFromBrowser() {
    try {
        var savedList = localStorage.getItem('gc_multi_list');
        if (!savedList) {
            alert('No formulas saved in browser yet');
            return;
        }
        
        var list = JSON.parse(savedList);
        if (list.length === 0) {
            alert('No formulas saved in browser yet');
            return;
        }
        
        var modal = document.getElementById('loadModal');
        var formulaList = document.getElementById('formulaList');
        formulaList.innerHTML = '';
        
        for (var i = 0; i < list.length; i++) {
            var cacheCode = list[i];
            var storageKey = 'gc_multi_' + cacheCode;
            var savedData = localStorage.getItem(storageKey);
            
            if (savedData) {
                var data = JSON.parse(savedData);
                var li = document.createElement('li');
                li.className = 'formula-item';
                
                var div = document.createElement('div');
                div.style.flex = '1';
                div.style.cursor = 'pointer';
                
                var nameDiv = document.createElement('div');
                nameDiv.className = 'formula-name';
                nameDiv.textContent = data.cacheName || cacheCode;
                
                var codeDiv = document.createElement('div');
                codeDiv.className = 'formula-code';
                codeDiv.textContent = cacheCode + ' (' + data.waypointCount + ' waypoints)';
                
                var dateDiv = document.createElement('div');
                dateDiv.className = 'formula-date';
                if (data.savedAt) {
                    var date = new Date(data.savedAt);
                    dateDiv.textContent = 'Saved: ' + date.toLocaleString();
                }
                
                div.appendChild(nameDiv);
                div.appendChild(codeDiv);
                div.appendChild(dateDiv);
                
                div.onclick = (function(code) {
                    return function() {
                        loadFormulaByCode(code);
                        modal.classList.remove('active');
                    };
                })(cacheCode);
                
                var deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = (function(code) {
                    return function(e) {
                        e.stopPropagation();
                        deleteFormula(code);
                    };
                })(cacheCode);
                
                li.appendChild(div);
                li.appendChild(deleteBtn);
                formulaList.appendChild(li);
            }
        }
        
        modal.classList.add('active');
    } catch (e) {
        alert('Error loading from browser: ' + e.message);
    }
}

function loadFormulaByCode(code) {
    try {
        var storageKey = 'gc_multi_' + code;
        var savedData = localStorage.getItem(storageKey);
        
        if (!savedData) {
            alert('Formula "' + code + '" not found');
            return;
        }
        
        var data = JSON.parse(savedData);
        applyLoadedData(data);
        alert('Formula "' + code + '" loaded successfully!');
    } catch (e) {
        alert('Error loading formula: ' + e.message);
    }
}

function deleteFormula(code) {
    if (!confirm('Are you sure you want to delete "' + code + '"?')) {
        return;
    }
    
    try {
        var storageKey = 'gc_multi_' + code;
        localStorage.removeItem(storageKey);
        
        var savedList = localStorage.getItem('gc_multi_list');
        if (savedList) {
            var list = JSON.parse(savedList);
            var index = list.indexOf(code);
            if (index > -1) {
                list.splice(index, 1);
                localStorage.setItem('gc_multi_list', JSON.stringify(list));
            }
        }
        
        loadFromBrowser();
    } catch (e) {
        alert('Error deleting formula: ' + e.message);
    }
}

function loadFromUrl() {
    var url = document.getElementById('urlInput').value.trim();
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    var corsProxy = 'https://corsproxy.io/?';
    var fetchUrl = url.startsWith('http://') || url.startsWith('https://') ? corsProxy + encodeURIComponent(url) : url;
    
    fetch(fetchUrl)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.text();
        })
        .then(function(text) {
            try {
                var data = JSON.parse(text);
                applyLoadedData(data);
                alert('Formula loaded successfully from URL!');
            } catch (error) {
                alert('Error parsing JSON: ' + error.message);
            }
        })
        .catch(function(error) {
            alert('Error loading from URL: ' + error.message + '\n\nNote: The URL must allow cross-origin requests or be a direct file link. You can try uploading the file directly using "Load from File" instead.');
        });
}

function applyLoadedData(data) {
    state.cacheCode = data.cacheCode || '';
    state.cacheName = data.cacheName || '';
    state.paramMethod = data.paramMethod || 'range';
    state.paramRange = data.paramRange || 'A-B';
    state.paramCustom = data.paramCustom || '';
    state.paramValues = data.paramValues || {};
    state.paramComments = data.paramComments || {};
    state.waypointCount = data.waypointCount || 1;
    state.waypoints = (data.waypoints || []).map(function(wp) {
        return Object.assign({ collapsedValues: ['','','','','',''], collapsed: false }, wp);
    });
    
    document.getElementById('cacheCode').value = state.cacheCode;
    document.getElementById('cacheName').value = state.cacheName;
    document.getElementById('paramMethod').value = state.paramMethod;
    document.getElementById('paramRangeSelect').value = state.paramRange;
    document.getElementById('paramCustom').value = state.paramCustom;
    document.getElementById('waypointCount').value = state.waypointCount;
    
    if (state.paramMethod === 'range') {
        document.getElementById('rangeGroup').style.display = 'block';
        document.getElementById('customGroup').style.display = 'none';
    } else {
        document.getElementById('rangeGroup').style.display = 'none';
        document.getElementById('customGroup').style.display = 'block';
    }
    
    updateParamInputs();
    updateWaypoints();
}

function clearAll() {
    if (!confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
        return;
    }
    
    state.cacheCode = '';
    state.cacheName = '';
    state.paramMethod = 'range';
    state.paramRange = 'A-B';
    state.paramCustom = '';
    state.paramValues = {};
    state.paramComments = {};
    state.waypointCount = 1;
    state.waypoints = [];
    
    document.getElementById('cacheCode').value = '';
    document.getElementById('cacheName').value = '';
    document.getElementById('paramMethod').value = 'range';
    document.getElementById('paramRangeSelect').value = 'A-B';
    document.getElementById('paramCustom').value = '';
    document.getElementById('waypointCount').value = '1';
    document.getElementById('urlInput').value = '';
    
    document.getElementById('rangeGroup').style.display = 'block';
    document.getElementById('customGroup').style.display = 'none';
    
    updateParamInputs();
    updateWaypoints();
}

function setupEventListeners() {
    document.getElementById('cacheCode').addEventListener('input', function(e) {
        state.cacheCode = e.target.value;
    });
    document.getElementById('cacheName').addEventListener('input', function(e) {
        state.cacheName = e.target.value;
    });
    document.getElementById('paramMethod').addEventListener('change', handleParamMethodChange);
    document.getElementById('paramRangeSelect').addEventListener('change', handleParamRangeChange);
    document.getElementById('paramCustom').addEventListener('input', handleParamCustomChange);
    document.getElementById('paramCustom').addEventListener('blur', handleParamCustomChange);
    document.getElementById('waypointCount').addEventListener('change', handleWaypointCountChange);
    document.getElementById('waypointCount').addEventListener('blur', handleWaypointCountChange);
    document.getElementById('saveBtn').addEventListener('click', saveFormula);
    document.getElementById('loadBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', loadFormula);
    document.getElementById('saveBrowserBtn').addEventListener('click', saveToBrowser);
    document.getElementById('loadBrowserBtn').addEventListener('click', loadFromBrowser);
    document.getElementById('loadUrlBtn').addEventListener('click', loadFromUrl);
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('loadModal').classList.remove('active');
    });
    
    document.getElementById('loadModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', init);