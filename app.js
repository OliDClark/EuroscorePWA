// Parse configuration - Users need to update these with their Parse server details
const PARSE_CONFIG = {
    appId: "xa3bEo60pNY2AlbGX5BIGmKTMsbnRBjRTOlQlGsS",
    javascriptKey: "bUZAnINWUmiTW0wljHgH3iiDRSUTljQObGjPTRlV",
    serverURL: 'https://pg-app-ed22jlv253ocu5itq213e4rcezp1r1.scalabl.cloud/1/' // e.g., 'https://parseapi.back4app.com'
};

// Initialize Parse
Parse.initialize(PARSE_CONFIG.appId, PARSE_CONFIG.javascriptKey);
Parse.serverURL = PARSE_CONFIG.serverURL;
console.log('Parse Config:', PARSE_CONFIG);

const APP_VERSION = 'v1.0.8';
const SCOREBOARD_QUERY_LIMIT = 10000;
const EUROVISION_POINTS_MULTIPLIER = 116;
const MAIN_SCOREBOARD_ANIMATION_DURATION_MS = 3000;
const MAIN_SCOREBOARD_COLUMN_COUNT = 2;
const MAIN_SCOREBOARD_MIN_ROW_HEIGHT_PX = 24;
const MAIN_SCOREBOARD_MAX_ROW_HEIGHT_PX = 92;
const MAIN_STAGING_MIN_TILE_HEIGHT_PX = 44;
const MAIN_STAGING_MAX_TILE_HEIGHT_PX = 122;
const MAIN_SCOREBOARD_SINGER_PLACEHOLDER = 'Singer TBC';
const MAIN_SCOREBOARD_SONG_PLACEHOLDER = 'Song TBC';
const PARSE_OBJECT_NOT_FOUND_ERROR_CODE = 101;
const PARTY_NOT_FOUND = 'Party not found';
const PARTY_NOT_FOUND_OR_PASSWORD_INCORRECT = 'Party not found or password incorrect';

// State management
const state = {
    currentUser: null,
    currentParty: null,
    userParties: [],
    hostedParties: [],
    joinedParties: [],
    currentUserVote: null,
    selectedSong: null,
    songVotesMap: {},
    pendingCounterVotes: null,
    existingCounterVotes: null,
    allSongs: [],
    competitions: [],
    appMode: localStorage.getItem('appMode') || 'score-entry',
    displayMode: localStorage.getItem('displayMode') || 'standalone'
};

// DOM elements cache
const elements = {
    loginScreen: document.getElementById('login-screen'),
    signupScreen: document.getElementById('signup-screen'),
    mainScreen: document.getElementById('main-screen'),
    partyScreen: document.getElementById('party-screen'),
    settingsScreen: document.getElementById('settings-screen'),
    
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginBtn: document.getElementById('login-btn'),
    loginError: document.getElementById('login-error'),
    
    signupUsername: document.getElementById('signup-username'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    signupBtn: document.getElementById('signup-btn'),
    signupError: document.getElementById('signup-error'),
    
    showSignupBtn: document.getElementById('show-signup-btn'),
    showLoginBtn: document.getElementById('show-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    usernameDisplay: document.getElementById('username-display'),
    settingsBtn: document.getElementById('settings-btn'),
    backFromSettingsBtn: document.getElementById('back-from-settings-btn'),
    appVersion: document.getElementById('app-version'),
    
    partyIdInput: document.getElementById('party-id-input'),
    partyCodeInput: document.getElementById('party-code-input'),
    joinPartyBtn: document.getElementById('join-party-btn'),
    joinError: document.getElementById('join-error'),
    
    partyNameInput: document.getElementById('party-name-input'),
    partyLocationInput: document.getElementById('party-location-input'),
    partyCodeInputCreate: document.getElementById('party-code-input-create'),
    competitionSelect: document.getElementById('competition-select'),
    guestVotingCheckbox: document.getElementById('guest-voting-checkbox'),
    createPartyBtn: document.getElementById('create-party-btn'),
    createError: document.getElementById('create-error'),
    
    partyTitle: document.getElementById('party-title'),
    partyDescription: document.getElementById('party-description'),
    partyCodeDisplay: document.getElementById('party-code-display'),
    voteStatus: document.getElementById('vote-status'),
    scoreboardContent: document.getElementById('scoreboard-content'),
    backToMainBtn: document.getElementById('back-to-main-btn'),
    refreshScoresBtn: document.getElementById('refresh-scores-btn'),
    
    hostedPartiesList: document.getElementById('hosted-parties-list'),
    joinedPartiesList: document.getElementById('joined-parties-list'),
    hostedSubtab: document.getElementById('hosted-subtab'),
    joinedSubtab: document.getElementById('joined-subtab'),
    songsSection: document.getElementById('songs-section'),
    songsList: document.getElementById('songs-list'),
    competitionInfo: document.getElementById('competition-info'),
    mainScoreboardSourceSelect: document.getElementById('main-scoreboard-source-select'),
    mainScoreboardPartySelectorWrap: document.getElementById('main-scoreboard-party-selector-wrap'),
    mainScoreboardCompetitionSelectorWrap: document.getElementById('main-scoreboard-competition-selector-wrap'),
    mainScoreboardPartySelect: document.getElementById('main-scoreboard-party-select'),
    mainScoreboardCompetitionSelect: document.getElementById('main-scoreboard-competition-select'),
    mainScoreboardBackBtn: document.getElementById('main-scoreboard-back-btn'),
    mainScoreboardFitBtn: document.getElementById('main-scoreboard-fit-btn'),
    mainRefreshScoresBtn: document.getElementById('main-refresh-scores-btn'),
    mainScoreboardSettingsToggle: document.getElementById('main-scoreboard-settings-toggle'),
    mainScoreboardControls: document.getElementById('main-scoreboard-controls'),
    mainScoreboardContent: document.getElementById('main-scoreboard-content'),
    mainScoreboardContext: document.getElementById('main-scoreboard-context'),
    
    applyDisplayBtn: document.getElementById('apply-display-btn'),
    applyModeBtn: document.getElementById('apply-mode-btn'),
    modeStatus: document.getElementById('mode-status'),

    qrModal: document.getElementById('qr-modal'),
    qrModalTitle: document.getElementById('qr-modal-title'),
    qrModalSubtitle: document.getElementById('qr-modal-subtitle'),
    qrModalClose: document.getElementById('qr-modal-close'),
    qrCodeContainer: document.getElementById('qr-code-container'),
    scanQrBtn: document.getElementById('scan-qr-btn'),
    stopScanBtn: document.getElementById('stop-scan-btn'),
    qrReader: document.getElementById('qr-reader'),
};

function getAppBasePath() {
    const path = window.location.pathname;
    if (path.endsWith('/')) {
        return path;
    }

    const lastSlashIndex = path.lastIndexOf('/');
    return lastSlashIndex === -1 ? '/' : path.substring(0, lastSlashIndex + 1);
}

function createDynamicManifest(displayMode) {
    const appBasePath = getAppBasePath();
    const appBaseUrl = new URL(appBasePath, window.location.origin);

    return {
        "name": "Euroscore",
        "short_name": "Euroscore",
        "description": "Vote and celebrate with friends!",
        "start_url": appBasePath,
        "scope": appBasePath,
        "display": displayMode,
        "background_color": "#ffffff",
        "theme_color": "#4285f4",
        "icons": [
            {
                "src": new URL('icon-192.png', appBaseUrl).href,
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": new URL('icon-512.png', appBaseUrl).href,
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    };
}

// Function to apply manifest display mode on page load
function applyManifestDisplayMode() {
    try {
        const savedMode = localStorage.getItem('displayMode') || 'standalone';
        
        // Create a dynamic manifest with the saved display mode
        const manifest = createDynamicManifest(savedMode);
        
        // Create a new manifest blob and URL
        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {type: 'application/json'});
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        // Update the manifest link in the document
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            manifestLink.href = manifestURL;
        }
    } catch (error) {
        console.error('Error applying manifest display mode:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved display mode on page load
    applyManifestDisplayMode();
    
    initializeApp();
    setupEventListeners();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.log('Service Worker registration failed', err));
    }
});

function initializeApp() {
    setAppVersion();

    const currentUser = Parse.User.current();
    if (currentUser) {
        state.currentUser = currentUser;
        showMainScreen();
    } else {
        showLoginScreen();
    }
}

function setAppVersion() {
    if (elements.appVersion) {
        elements.appVersion.textContent = APP_VERSION;
    }
}

// Screen navigation
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

function showLoginScreen() {
    showScreen(elements.loginScreen);
}

function showSignupScreen() {
    showScreen(elements.signupScreen);
}

function showMainScreen() {
    showScreen(elements.mainScreen);
    elements.usernameDisplay.textContent = state.currentUser.getUsername();
    loadUserParties();
    loadCompetitionsForDropdown();
}

function showPartyScreen(party) {
    state.currentParty = party;
    showScreen(elements.partyScreen);
    
    // Clear selected song
    state.selectedSong = null;
    
    // Switch to appropriate tab based on app mode
    if (state.appMode === 'scoreboard') {
        // In Scoreboard mode, default to scoreboard tab
        switchPartyTab('scoreboard');
    } else {
        // In Score Entry mode, default to voting tab
        switchPartyTab('voting');
    }
    
    updatePartyScreen();
}

function showSettingsScreen() {
    showScreen(elements.settingsScreen);
}

// Event listeners
function setupEventListeners() {
    // Auth
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.signupBtn.addEventListener('click', handleSignup);
    elements.showSignupBtn.addEventListener('click', showSignupScreen);
    elements.showLoginBtn.addEventListener('click', showLoginScreen);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Enter key for login
    elements.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Sub-tabs (for My Parties)
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.dataset.subtab;
            switchSubTab(subtab);
        });
    });
    
    // Party tabs (for Party Detail screen)
    document.querySelectorAll('.party-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const partytab = btn.dataset.partytab;
            switchPartyTab(partytab);
        });
    });
    
    // Party actions
    elements.joinPartyBtn.addEventListener('click', () => handleJoinParty({ requirePartyId: true }));
    elements.createPartyBtn.addEventListener('click', handleCreateParty);
    elements.backToMainBtn.addEventListener('click', showMainScreen);
    elements.refreshScoresBtn.addEventListener('click', loadScoreboard);
    elements.mainScoreboardBackBtn.addEventListener('click', () => switchTab('my-parties'));
    elements.mainScoreboardFitBtn.addEventListener('click', recalculateMainScoreboardCellSizing);
    elements.mainRefreshScoresBtn.addEventListener('click', () => loadMainScoreboard({ runRefreshAnimation: true }));
    elements.mainScoreboardSettingsToggle.addEventListener('click', toggleMainScoreboardControls);
    elements.mainScoreboardSourceSelect.addEventListener('change', handleMainScoreboardSourceChange);
    elements.mainScoreboardPartySelect.addEventListener('change', loadMainScoreboard);
    elements.mainScoreboardCompetitionSelect.addEventListener('change', loadMainScoreboard);

    // QR code
    elements.scanQrBtn.addEventListener('click', handleScanQR);
    elements.stopScanBtn.addEventListener('click', stopQRScanner);
    elements.qrModalClose.addEventListener('click', closeQRModal);
    elements.qrModal.addEventListener('click', (e) => {
        if (e.target === elements.qrModal) closeQRModal();
    });
    
    // Voting
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', () => handleVote(btn.dataset.vote));
    });
    
    // Settings
    elements.settingsBtn.addEventListener('click', showSettingsScreen);
    elements.backFromSettingsBtn.addEventListener('click', showMainScreen);
    elements.applyDisplayBtn.addEventListener('click', applyDisplayMode);
    elements.applyModeBtn.addEventListener('click', applyAppMode);
    
    // Initialize settings radio buttons
    initializeSettings();
}

function switchTab(tab) {
    elements.mainScreen.classList.toggle('scoreboard-main-mode', tab === 'scoreboard-main');

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tab}-tab`).classList.remove('hidden');

    if (tab === 'scoreboard-main') {
        prepareMainScoreboardTab();
    }
}

function switchSubTab(subtab) {
    // Update buttons
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    
    // Update content
    document.querySelectorAll('.sub-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${subtab}-subtab`).classList.remove('hidden');
}

function switchPartyTab(partytab) {
    // Update buttons
    document.querySelectorAll('.party-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.partytab === partytab);
    });
    
    // Update content
    document.querySelectorAll('.party-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${partytab}-tab`).classList.remove('hidden');
    
    // If switching to scoreboard tab, refresh the scoreboard
    if (partytab === 'scoreboard') {
        loadScoreboard();
    }
}

// Authentication handlers
async function handleLogin() {
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value;
    
    elements.loginError.textContent = '';
    
    if (!username || !password) {
        elements.loginError.textContent = 'Please enter username and password';
        return;
    }
    
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Logging in...';
    
    try {
        const user = await Parse.User.logIn(username, password);
        state.currentUser = user;
        showMainScreen();
    } catch (error) {
        elements.loginError.textContent = error.message;
    } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.textContent = 'Login';
    }
}

async function handleSignup() {
    const username = elements.signupUsername.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    
    elements.signupError.textContent = '';
    
    if (!username || !email || !password) {
        elements.signupError.textContent = 'Please fill in all fields';
        return;
    }
    
    elements.signupBtn.disabled = true;
    elements.signupBtn.textContent = 'Creating account...';
    
    try {
        const user = new Parse.User();
        user.set('username', username);
        user.set('email', email);
        user.set('password', password);
        user.set('Name', username); // Also set Name field for display
        
        await user.signUp();
        state.currentUser = user;
        showMainScreen();
    } catch (error) {
        elements.signupError.textContent = error.message;
    } finally {
        elements.signupBtn.disabled = false;
        elements.signupBtn.textContent = 'Sign Up';
    }
}

async function handleLogout() {
    try {
        await Parse.User.logOut();
        state.currentUser = null;
        state.currentParty = null;
        state.userParties = [];
        showLoginScreen();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Load competitions for the dropdown in Create Party tab
async function loadCompetitionsForDropdown() {
    try {
        const Competitions = Parse.Object.extend('Competitions');
        const query = new Parse.Query(Competitions);
        query.descending('year');
        query.limit(100);
        
        const competitions = await query.find();
        state.competitions = competitions;
        
        // Populate the dropdown
        elements.competitionSelect.innerHTML = '<option value="">Select a Competition...</option>';
        
        competitions.forEach(comp => {
            const option = document.createElement('option');
            option.value = comp.id;
            const stage = comp.get('stage') || comp.get('Stage') || '';
            const year = comp.get('year') || comp.get('Year') || '';
            option.textContent = `${stage} ${year}`.trim();
            elements.competitionSelect.appendChild(option);
        });

        populateMainScoreboardCompetitionOptions();
    } catch (error) {
        console.error('Error loading competitions:', error);
    }
}

// Party management
async function loadUserParties() {
    elements.hostedPartiesList.innerHTML = '<p class="loading">Loading hosted parties...</p>';
    elements.joinedPartiesList.innerHTML = '<p class="loading">Loading joined parties...</p>';
    
    try {
        const Parties = Parse.Object.extend('Parties');
        
        // Query 1: Find parties where user is host (fast server-side query)
        const hostQuery = new Parse.Query(Parties);
        hostQuery.equalTo('Host', state.currentUser);
        hostQuery.include('Host');
        hostQuery.include('whichComp');
        hostQuery.descending('createdAt');
        
        // Query 2: Find parties where user is in Guests relation
        // We need to query from the Parties class where the Guests relation contains the current user
        const guestQuery = new Parse.Query(Parties);
        guestQuery.equalTo('Guests', state.currentUser);
        guestQuery.include('Host');
        guestQuery.include('whichComp');
        guestQuery.descending('createdAt');
        
        // Execute both queries in parallel for speed
        const [hostedParties, joinedParties] = await Promise.all([
            hostQuery.find(),
            guestQuery.find()
        ]);
        
        // Filter out parties where user is both host and guest (show only in hosted)
        const hostedIds = new Set(hostedParties.map(p => p.id));
        const filteredJoinedParties = joinedParties.filter(p => !hostedIds.has(p.id));
        
        // Store in state for reference
        state.hostedParties = hostedParties;
        state.joinedParties = filteredJoinedParties;
        
        displayParties();
        populateMainScoreboardPartyOptions();
    } catch (error) {
        console.error('Error loading parties:', error);
        elements.hostedPartiesList.innerHTML = '<p class="error-message">Failed to load hosted parties</p>';
        elements.joinedPartiesList.innerHTML = '<p class="error-message">Failed to load joined parties</p>';
    }
}

function displayParties() {
    // Display hosted parties in their tab
    if (state.hostedParties.length === 0) {
        elements.hostedPartiesList.innerHTML = '<p class="loading">No hosted parties yet. Create one!</p>';
    } else {
        elements.hostedPartiesList.innerHTML = '';
        state.hostedParties.forEach(party => {
            elements.hostedPartiesList.appendChild(createPartyCard(party));
        });
    }
    
    // Display joined parties in their tab
    if (state.joinedParties.length === 0) {
        elements.joinedPartiesList.innerHTML = '<p class="loading">No joined parties yet. Join one!</p>';
    } else {
        elements.joinedPartiesList.innerHTML = '';
        state.joinedParties.forEach(party => {
            elements.joinedPartiesList.appendChild(createPartyCard(party));
        });
    }
}

function getAllUserParties() {
    const byId = new Map();
    [...state.hostedParties, ...state.joinedParties].forEach(party => {
        if (party && party.id) byId.set(party.id, party);
    });
    return Array.from(byId.values());
}

function populateMainScoreboardPartyOptions() {
    const parties = getAllUserParties();
    const currentValue = elements.mainScoreboardPartySelect.value;

    elements.mainScoreboardPartySelect.innerHTML = '<option value="">Select a party...</option>';
    parties.forEach(party => {
        const option = document.createElement('option');
        option.value = party.id;
        option.textContent = party.get('Name') || 'Unnamed Party';
        elements.mainScoreboardPartySelect.appendChild(option);
    });

    if (currentValue && parties.some(p => p.id === currentValue)) {
        elements.mainScoreboardPartySelect.value = currentValue;
    }
}

function populateMainScoreboardCompetitionOptions() {
    const currentValue = elements.mainScoreboardCompetitionSelect.value;
    elements.mainScoreboardCompetitionSelect.innerHTML = '<option value="">Select a competition...</option>';

    state.competitions.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.id;
        const stage = comp.get('stage') || comp.get('Stage') || '';
        const year = comp.get('year') || comp.get('Year') || '';
        option.textContent = `${stage} ${year}`.trim() || 'Unnamed Competition';
        elements.mainScoreboardCompetitionSelect.appendChild(option);
    });

    if (currentValue && state.competitions.some(c => c.id === currentValue)) {
        elements.mainScoreboardCompetitionSelect.value = currentValue;
    }
}

function prepareMainScoreboardTab() {
    populateMainScoreboardPartyOptions();
    populateMainScoreboardCompetitionOptions();
    elements.mainScoreboardControls.classList.add('hidden');
    elements.mainScoreboardSettingsToggle.classList.remove('active');
    handleMainScoreboardSourceChange();
}

function toggleMainScoreboardControls() {
    elements.mainScoreboardControls.classList.toggle('hidden');
    elements.mainScoreboardSettingsToggle.classList.toggle('active', !elements.mainScoreboardControls.classList.contains('hidden'));
}

function handleMainScoreboardSourceChange() {
    const source = elements.mainScoreboardSourceSelect.value;
    elements.mainScoreboardPartySelectorWrap.classList.toggle('hidden', source !== 'party');
    elements.mainScoreboardCompetitionSelectorWrap.classList.toggle('hidden', source !== 'competition');

    if (!source) {
        elements.mainScoreboardContext.style.display = 'none';
        elements.mainScoreboardContent.innerHTML = '<p class="loading">Choose a source to view the scoreboard.</p>';
        return;
    }

    loadMainScoreboard();
}

function createPartyCard(party) {
    const card = document.createElement('div');
    card.className = 'party-card';
    card.onclick = () => showPartyScreen(party);
    
    const name = party.get('Name');
    const location = party.get('Location') || 'No location';
    const password = party.get('Password');
    const created = party.createdAt.toLocaleDateString();
    const comp = party.get('whichComp');
    const compInfo = comp ? `${comp.get('stage')} ${comp.get('year')}` : 'General';
    
    card.innerHTML = `
        <h4>${escapeHtml(name)}</h4>
        <p><strong>${escapeHtml(compInfo)}</strong> • ${escapeHtml(location)}</p>
        <div class="party-meta">
            <span>Code: ${escapeHtml(password)}</span>
            <span>Created: ${created}</span>
        </div>
    `;

    const qrBtn = document.createElement('button');
    qrBtn.className = 'btn btn-secondary btn-small qr-btn';
    qrBtn.textContent = '📲 Show QR Code';
    qrBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showQRModal(party);
    });
    card.appendChild(qrBtn);
    
    return card;
}

async function handleCreateParty() {
    const name = elements.partyNameInput.value.trim();
    const location = elements.partyLocationInput.value.trim();
    const partyCode = elements.partyCodeInputCreate.value.trim().toUpperCase();
    const competitionId = elements.competitionSelect.value;
    const guestVoting = elements.guestVotingCheckbox.checked;
    
    elements.createError.textContent = '';
    
    if (!name) {
        elements.createError.textContent = 'Please enter a party name';
        return;
    }
    
    if (!partyCode) {
        elements.createError.textContent = 'Please enter a party code';
        return;
    }
    
    if (!competitionId) {
        elements.createError.textContent = 'Please select a competition';
        return;
    }
    
    elements.createPartyBtn.disabled = true;
    elements.createPartyBtn.textContent = 'Creating...';
    
    try {
        // Check if party name already exists
        const Parties = Parse.Object.extend('Parties');
        const nameQuery = new Parse.Query(Parties);
        nameQuery.equalTo('Name', name);
        const existingParty = await nameQuery.first();
        
        if (existingParty) {
            elements.createError.textContent = 'Party name already exists. Please choose another.';
            return;
        }

        // Check if party code already exists
        const codeQuery = new Parse.Query(Parties);
        codeQuery.equalTo('Password', partyCode);
        const existingCodeParty = await codeQuery.first();

        if (existingCodeParty) {
            elements.createError.textContent = 'Party code is already taken. Please choose another.';
            return;
        }
        
        const party = new Parties();
        
        party.set('Name', name);
        party.set('Location', location || 'Online');
        party.set('Password', partyCode);
        party.set('Host', state.currentUser);
        party.set('GuestVoting', guestVoting);
        
        // Set the competition pointer
        const Competitions = Parse.Object.extend('Competitions');
        const competition = Competitions.createWithoutData(competitionId);
        party.set('whichComp', competition);
        
        await party.save();
        
        // Add creator as guest
        const guestsRelation = party.relation('Guests');
        guestsRelation.add(state.currentUser);
        await party.save();
        
        // Refresh parties list
        await loadUserParties();
        
        // Clear form
        elements.partyNameInput.value = '';
        elements.partyLocationInput.value = '';
        elements.partyCodeInputCreate.value = '';
        elements.competitionSelect.value = '';
        elements.guestVotingCheckbox.checked = true;
        
        // Show success and switch to parties tab
        switchTab('my-parties');
        
        // Show the new party
        showPartyScreen(party);
        
    } catch (error) {
        console.error('Error creating party:', error);
        elements.createError.textContent = 'Failed to create party: ' + error.message;
    } finally {
        elements.createPartyBtn.disabled = false;
        elements.createPartyBtn.textContent = 'Create Party';
    }
}

function normalizePartyPassword(value) {
    return (value || '').trim().toUpperCase();
}

async function handleJoinParty(options = {}) {
    const { requirePartyId = false, partyId = null } = options;
    let resolvedPartyId = (partyId || '').trim();
    if (!resolvedPartyId && requirePartyId) {
        resolvedPartyId = (elements.partyIdInput?.value || '').trim();
    }
    const password = normalizePartyPassword(elements.partyCodeInput.value);
    
    elements.joinError.textContent = '';
    
    if (requirePartyId && !resolvedPartyId) {
        elements.joinError.textContent = 'Please enter a Party ID';
        return;
    }

    if (!password) {
        elements.joinError.textContent = 'Please enter a Party Password';
        return;
    }
    
    elements.joinPartyBtn.disabled = true;
    elements.joinPartyBtn.textContent = 'Joining...';
    
    try {
        // Find party by ID and password (manual join), or by password only (legacy QR payload)
        const Parties = Parse.Object.extend('Parties');
        const query = new Parse.Query(Parties);
        let party = null;

        if (resolvedPartyId) {
            try {
                party = await query.get(resolvedPartyId);
            } catch (error) {
                if (error && error.code === PARSE_OBJECT_NOT_FOUND_ERROR_CODE) {
                    party = null;
                } else {
                    throw error;
                }
            }

            if (party) {
                const partyPassword = normalizePartyPassword(party.get('Password'));
                if (partyPassword !== password) {
                    party = null;
                }
            }
        } else {
            query.equalTo('Password', password);
            party = await query.first();
        }
        
        if (!party) {
            elements.joinError.textContent = resolvedPartyId
                ? PARTY_NOT_FOUND_OR_PASSWORD_INCORRECT
                : PARTY_NOT_FOUND;
            return;
        }
        
        // Check if already a guest
        const guestsRelation = party.relation('Guests');
        const guestsQuery = guestsRelation.query();
        guestsQuery.equalTo('objectId', state.currentUser.id);
        const existing = await guestsQuery.first();
        
        if (existing) {
            // Already a member, just show the party
            await loadUserParties();
            showPartyScreen(party);
            return;
        }
        
        // Add as guest
        guestsRelation.add(state.currentUser);
        await party.save();
        
        // Refresh parties list
        await loadUserParties();
        
        // Clear input
        if (elements.partyIdInput) {
            elements.partyIdInput.value = '';
        }
        elements.partyCodeInput.value = '';
        
        // Show the party
        showPartyScreen(party);
        
    } catch (error) {
        console.error('Error joining party:', error);
        elements.joinError.textContent = 'Failed to join party: ' + error.message;
    } finally {
        elements.joinPartyBtn.disabled = false;
        elements.joinPartyBtn.textContent = 'Join Party';
    }
}

async function joinPartyById(partyId) {
    elements.joinError.textContent = '';
    elements.joinPartyBtn.disabled = true;
    elements.joinPartyBtn.textContent = 'Joining...';

    try {
        const Parties = Parse.Object.extend('Parties');
        const query = new Parse.Query(Parties);
        const party = await query.get(partyId);

        // Check if already a guest
        const guestsRelation = party.relation('Guests');
        const guestsQuery = guestsRelation.query();
        guestsQuery.equalTo('objectId', state.currentUser.id);
        const existing = await guestsQuery.first();

        if (existing) {
            // Already a member, just show the party
            await loadUserParties();
            showPartyScreen(party);
            return;
        }

        // Add as guest
        guestsRelation.add(state.currentUser);
        await party.save();

        // Refresh parties list
        await loadUserParties();

        // Clear input
        if (elements.partyIdInput) {
            elements.partyIdInput.value = '';
        }
        elements.partyCodeInput.value = '';

        // Show the party
        showPartyScreen(party);
    } catch (error) {
        console.error('Error joining party by ID:', error);
        elements.joinError.textContent = 'Failed to join party: ' + error.message;
    } finally {
        elements.joinPartyBtn.disabled = false;
        elements.joinPartyBtn.textContent = 'Join Party';
    }
}

// QR Code state
let html5QrCode = null;
let isProcessingScan = false;

// Show QR code modal for a party
function showQRModal(party) {
    const name = party.get('Name');
    const password = party.get('Password');
    const payload = `euroscore:party:${party.id}`;

    elements.qrModalTitle.textContent = name;
    elements.qrModalSubtitle.textContent = `Party Code: ${password}`;

    // Clear any previous QR code
    elements.qrCodeContainer.innerHTML = '';

    // Generate QR code
    new QRCode(elements.qrCodeContainer, {
        text: payload,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    elements.qrModal.classList.remove('hidden');
}

// Close QR code modal
function closeQRModal() {
    elements.qrModal.classList.add('hidden');
    elements.qrCodeContainer.innerHTML = '';
}

// Start QR code scanner
async function handleScanQR() {
    elements.joinError.textContent = '';
    isProcessingScan = false;
    elements.scanQrBtn.classList.add('hidden');
    elements.qrReader.classList.remove('hidden');
    elements.stopScanBtn.classList.remove('hidden');

    html5QrCode = new Html5Qrcode('qr-reader');

    try {
        await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onQRCodeScanned
        );
    } catch (err) {
        console.error('Error starting QR scanner:', err);
        elements.joinError.textContent = 'Could not access camera. Please allow camera permissions.';
        await stopQRScanner();
    }
}

// Callback when a QR code is successfully scanned
async function onQRCodeScanned(decodedText) {
    if (isProcessingScan) return; // Guard against multiple rapid callbacks
    isProcessingScan = true;
    await stopQRScanner();

    const prefix = 'euroscore:';
    if (!decodedText.startsWith(prefix)) {
        elements.joinError.textContent = 'QR Code not recognised';
        isProcessingScan = false;
        return;
    }

    const payload = decodedText.substring(prefix.length);

    try {
        if (payload.startsWith('party:')) {
            const partyId = payload.substring('party:'.length).trim();
            if (!partyId) {
                elements.joinError.textContent = 'QR Code not recognised';
                return;
            }
            await joinPartyById(partyId);
            return;
        }

        const partyCode = payload.trim();
        if (!partyCode) {
            elements.joinError.textContent = 'QR Code not recognised';
            return;
        }

        elements.partyCodeInput.value = partyCode;
        await handleJoinParty();
    } finally {
        isProcessingScan = false;
    }
}

// Stop the QR code scanner
async function stopQRScanner() {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
        } catch (e) {
            console.error('Error stopping scanner:', e);
        } finally {
            html5QrCode = null;
        }
    }
    elements.qrReader.classList.add('hidden');
    elements.stopScanBtn.classList.add('hidden');
    elements.scanQrBtn.classList.remove('hidden');
}


async function updatePartyScreen() {
    const party = state.currentParty;
    
    // Fetch the party object to ensure we have all properties including GuestVoting
    try {
        await party.fetch();
        console.log('Party GuestVoting:', party.get('GuestVoting'));
    } catch (error) {
        console.error('Error fetching party details:', error);
    }
    
    elements.partyTitle.textContent = party.get('Name');
    elements.partyDescription.textContent = party.get('Location') || 'No location';
    elements.partyCodeDisplay.textContent = party.get('Password');
    
    // Display competition stage and year
    const competition = party.get('whichComp');
    if (competition) {
        try {
            await competition.fetch();
            const stage = competition.get('stage') || competition.get('Stage') || '';
            const year = competition.get('year') || competition.get('Year') || '';
            elements.competitionInfo.textContent = `${stage} ${year}`.trim();
            elements.competitionInfo.style.display = 'block';
        } catch (error) {
            console.error('Error fetching competition:', error);
            elements.competitionInfo.style.display = 'none';
        }
    } else {
        elements.competitionInfo.style.display = 'none';
    }
    
    // Load current user's vote
    await loadUserVote();
    
    // Load songs from competition
    await loadPartySongs();
    
    // Load scoreboard
    await loadScoreboard();
}

// Load songs for the party based on competition's whereObject
async function loadPartySongs() {
    const party = state.currentParty;
    
    // Check if party has a competition pointer
    const competition = party.get('whichComp');
    
    if (!competition) {
        // No competition linked, hide the songs section
        elements.songsSection.style.display = 'none';
        return;
    }
    
    // Show the songs section
    elements.songsSection.style.display = 'block';
    elements.songsList.innerHTML = '<p class="loading">Loading songs...</p>';
    
    try {
        const songs = await fetchSongsForCompetition(competition);
        
        if (songs.length === 0) {
            elements.songsList.innerHTML = '<p class="loading">No songs found for this competition</p>';
            return;
        }
        
        // Display the songs
        displaySongs(songs);
        
    } catch (error) {
        console.error('Error loading songs:', error);
        elements.songsList.innerHTML = '<p class="error-message">Failed to load songs: ' + error.message + '</p>';
    }
}

async function fetchSongsForCompetition(competition) {
    if (!competition) return [];

    await competition.fetch();

    const whereObject = competition.get('whereObject');
    const stage = competition.get('stage') || competition.get('Stage');

    if (!whereObject) {
        return [];
    }

    let queryParams = whereObject;
    if (typeof whereObject === 'string') {
        queryParams = JSON.parse(whereObject);
    }

    const Songs = Parse.Object.extend('Songs');
    const query = new Parse.Query(Songs);

    for (const [key, value] of Object.entries(queryParams)) {
        if (typeof value === 'object' && value !== null) {
            if (value.__type === 'Pointer') {
                const pointerObj = Parse.Object.extend(value.className).createWithoutData(value.objectId);
                query.equalTo(key, pointerObj);
            } else {
                for (const [op, opValue] of Object.entries(value)) {
                    switch (op) {
                        case '$gt': query.greaterThan(key, opValue); break;
                        case '$gte': query.greaterThanOrEqualTo(key, opValue); break;
                        case '$lt': query.lessThan(key, opValue); break;
                        case '$lte': query.lessThanOrEqualTo(key, opValue); break;
                        case '$ne': query.notEqualTo(key, opValue); break;
                        case '$in': query.containedIn(key, opValue); break;
                        default: query.equalTo(key, value); break;
                    }
                }
            }
        } else {
            query.equalTo(key, value);
        }
    }

    const stageLower = (stage || '').toLowerCase();
    if (stageLower.includes('final') && !stageLower.includes('semi')) {
        query.ascending('finalOrder');
    } else {
        query.ascending('semiOrder');
    }

    return query.find();
}

// Load user's votes for songs in the current party
async function loadUserSongVotes(songs) {
    const party = state.currentParty;
    const songVotesMap = {};
    
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        
        // Create pointer to the party for proper comparison
        const Parties = Parse.Object.extend('Parties');
        const partyPointer = Parties.createWithoutData(party.id);
        
        const query = new Parse.Query(Thumbs);
        query.equalTo('whoseVote', state.currentUser);
        query.equalTo('whichParty', partyPointer);
        query.include('songDeets');
        query.limit(10000); // Set high limit for consistency
        
        const votes = await query.find();
        
        console.log('Found votes for user:', votes.length);
        
        // Map votes by song objectId
        votes.forEach(vote => {
            const songDeets = vote.get('songDeets');
            if (songDeets) {
                const songId = songDeets.id;
                songVotesMap[songId] = vote;
                console.log('Vote for song:', songId, 'up:', vote.get('thumbsUp'), 'mid:', vote.get('thumbsMid'), 'down:', vote.get('thumbsDown'));
            }
        });
    } catch (error) {
        console.error('Error loading song votes:', error);
    }
    
    return songVotesMap;
}

// Load all votes for all songs (when GuestVoting is false, show aggregated counts)
async function loadAllSongVotes(songs) {
    const party = state.currentParty;
    const songVotesMap = {};
    
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        
        // Create pointer to the party for proper comparison
        const Parties = Parse.Object.extend('Parties');
        const partyPointer = Parties.createWithoutData(party.id);
        
        const query = new Parse.Query(Thumbs);
        query.equalTo('whichParty', partyPointer);
        query.include('songDeets');
        query.limit(10000); // Set high limit to capture all votes for large parties
        
        const votes = await query.find();
        
        console.log('Found all votes for party:', votes.length);
        
        // Aggregate votes by song objectId
        votes.forEach(vote => {
            const songDeets = vote.get('songDeets');
            if (songDeets) {
                const songId = songDeets.id;
                if (!songVotesMap[songId]) {
                    songVotesMap[songId] = { up: 0, mid: 0, down: 0 };
                }
                songVotesMap[songId].up += vote.get('thumbsUp') || 0;
                songVotesMap[songId].mid += vote.get('thumbsMid') || 0;
                songVotesMap[songId].down += vote.get('thumbsDown') || 0;
            }
        });
    } catch (error) {
        console.error('Error loading all song votes:', error);
    }
    
    return songVotesMap;
}

// Get vote display for a vote object
// When guestVoting is false, show aggregated counts; otherwise show single emoji
function getVoteDisplay(vote, guestVoting = true) {
    if (!vote) return '';
    
    // If guestVoting is false, vote is an object with aggregated counts {up, mid, down}
    if (!guestVoting) {
        const up = vote.up || 0;
        const mid = vote.mid || 0;
        const down = vote.down || 0;
        
        if (up === 0 && mid === 0 && down === 0) return '';
        
        return `👍${up} 👊${mid} 👎${down}`;
    }
    
    // GuestVoting is true - show single emoji for user's vote
    const up = vote.get('thumbsUp') || 0;
    const mid = vote.get('thumbsMid') || 0;
    const down = vote.get('thumbsDown') || 0;
    
    if (up > 0) return '👍';
    if (mid > 0) return '👊';
    if (down > 0) return '👎';
    
    return '';
}

// Display songs list with user votes
async function displaySongs(songs) {
    elements.songsList.innerHTML = '<p class="loading">Loading votes...</p>';
    
    // Store songs in state for reference
    state.allSongs = songs;
    
    // Check if GuestVoting is false - if so, show aggregated counts
    const party = state.currentParty;
    const guestVoting = party.get('GuestVoting') !== false; // Default to true if not set
    
    let songVotesMap;
    if (guestVoting) {
        // Load user's votes for these songs
        songVotesMap = await loadUserSongVotes(songs);
    } else {
        // Load all votes aggregated for each song
        songVotesMap = await loadAllSongVotes(songs);
    }
    
    // Store votes map in state for reference
    state.songVotesMap = songVotesMap;
    
    elements.songsList.innerHTML = '';
    
    songs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.dataset.songId = song.id;
        
        const country = song.get('countryName') || song.get('CountryName') || 'Unknown';
        const countryCode = song.get('countryCode') || song.get('CountryCode') || '';
        const artist = song.get('singer') || song.get('Singer') || 'Unknown Artist';
        const songName = song.get('song') || song.get('Song') || song.get('title') || song.get('Title') || 'Unknown Song';
        
        // Generate flag emoji from country code
        const flag = countryCode ? getCountryFlag(countryCode) : '🏳️';
        
        // Get vote for this song
        const vote = songVotesMap[song.id];
        const voteDisplay = getVoteDisplay(vote, guestVoting);
        
        songItem.innerHTML = `
            <div class="song-order">${index + 1}</div>
            <div class="song-flag">${flag}</div>
            <div class="song-details">
                <div class="song-country">${escapeHtml(country)}</div>
                <div class="song-artist">${escapeHtml(artist)}</div>
                <div class="song-title">${escapeHtml(songName)}</div>
            </div>
            <div class="song-vote">${voteDisplay}</div>
        `;
        
        // Add click handler to select this song for voting
        songItem.addEventListener('click', () => selectSongForVoting(song));
        
        elements.songsList.appendChild(songItem);
    });
}

// Select a song for voting
async function selectSongForVoting(song) {
    state.selectedSong = song;
    
    // Highlight the selected song
    document.querySelectorAll('.song-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.songId === song.id) {
            item.classList.add('selected');
        }
    });
    
    const country = song.get('countryName') || song.get('CountryName') || 'Unknown';
    const countryCode = song.get('countryCode') || song.get('CountryCode') || '';
    const flag = countryCode ? getCountryFlag(countryCode) : '🏳️';
    
    // Update the voting section header to show which song is selected
    const votingSection = document.querySelector('.voting-section h3');
    if (votingSection) {
        votingSection.innerHTML = `Cast Your Vote for ${flag} ${escapeHtml(country)}`;
    }
    
    // Check if GuestVoting is false - show counter interface with +/- buttons
    const party = state.currentParty;
    const guestVoting = party.get('GuestVoting') !== false;
    
    if (!guestVoting) {
        // Show counter interface with +/- buttons
        await showCounterVotingInterface(song);
    } else {
        // Show normal voting interface
        showNormalVotingInterface();
        await loadSongVote(song);
    }
}

// Show the normal voting interface (single vote buttons)
function showNormalVotingInterface() {
    const voteButtonsContainer = document.querySelector('.vote-buttons');
    if (voteButtonsContainer) {
        voteButtonsContainer.innerHTML = `
            <button class="vote-btn" data-vote="up" title="Thumbs Up">
                👍
                <span>Up</span>
            </button>
            <button class="vote-btn" data-vote="middle" title="Thumbs Middle">
                👊
                <span>Middle</span>
            </button>
            <button class="vote-btn" data-vote="down" title="Thumbs Down">
                👎
                <span>Down</span>
            </button>
        `;
        
        voteButtonsContainer.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => handleVote(btn.dataset.vote));
        });
    }
}

// Show the counter voting interface with +/- buttons (when GuestVoting is false)
async function showCounterVotingInterface(song) {
    // Load stored votes for this specific song to drive submit/update state
    const songVotes = state.songVotesMap[song.id] || {};
    const existingVotes = {
        up: songVotes.up || 0,
        mid: songVotes.mid || 0,
        down: songVotes.down || 0
    };
    const votes = { ...existingVotes };
    state.pendingCounterVotes = votes;
    state.existingCounterVotes = existingVotes;
    
    const voteButtonsContainer = document.querySelector('.vote-buttons');
    if (voteButtonsContainer) {
        const hasExistingVotes = existingVotes.up > 0 || existingVotes.mid > 0 || existingVotes.down > 0;
        const actionLabel = hasExistingVotes ? 'Update' : 'Submit';

        voteButtonsContainer.innerHTML = `
            <div class="counter-vote">
                <span class="vote-emoji">👍</span>
                <div class="counter-controls">
                    <button class="counter-btn plus" data-type="up">+</button>
                    <span class="counter-value" id="counter-up">${votes.up}</span>
                    <button class="counter-btn minus" data-type="up">−</button>
                </div>
            </div>
            <div class="counter-vote">
                <span class="vote-emoji">👊</span>
                <div class="counter-controls">
                    <button class="counter-btn plus" data-type="mid">+</button>
                    <span class="counter-value" id="counter-mid">${votes.mid}</span>
                    <button class="counter-btn minus" data-type="mid">−</button>
                </div>
            </div>
            <div class="counter-vote">
                <span class="vote-emoji">👎</span>
                <div class="counter-controls">
                    <button class="counter-btn plus" data-type="down">+</button>
                    <span class="counter-value" id="counter-down">${votes.down}</span>
                    <button class="counter-btn minus" data-type="down">−</button>
                </div>
            </div>
            <button class="btn btn-primary counter-submit-btn" id="counter-submit-btn">${actionLabel}</button>
        `;
        
        // Attach event listeners for +/- buttons
        voteButtonsContainer.querySelectorAll('.counter-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => adjustVoteCount(btn.dataset.type, 1));
        });
        voteButtonsContainer.querySelectorAll('.counter-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => adjustVoteCount(btn.dataset.type, -1));
        });

        const submitBtn = voteButtonsContainer.querySelector('#counter-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', handleCounterVoteSubmit);
        }
    }
    
    elements.voteStatus.textContent = 'Tap + or - to adjust vote counts, then submit.';
}

// Adjust vote count (for counter interface when GuestVoting is false)
function adjustVoteCount(type, delta) {
    if (!state.selectedSong || !state.currentParty) {
        console.error('No song or party selected');
        return;
    }
    
    if (!state.pendingCounterVotes) {
        state.pendingCounterVotes = { up: 0, mid: 0, down: 0 };
    }

    const currentValue = state.pendingCounterVotes[type] || 0;
    const newValue = Math.max(0, currentValue + delta);
    state.pendingCounterVotes[type] = newValue;

    const counterEl = document.getElementById(`counter-${type}`);
    if (counterEl) {
        counterEl.textContent = newValue;
    }

    elements.voteStatus.textContent = 'Changes pending. Press Submit/Update to save.';
}

async function handleCounterVoteSubmit() {
    if (!state.selectedSong || !state.currentParty || !state.pendingCounterVotes) {
        return;
    }

    const song = state.selectedSong;
    const songId = song.id;

    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        const Parties = Parse.Object.extend('Parties');
        const Songs = Parse.Object.extend('Songs');
        
        const partyPointer = Parties.createWithoutData(state.currentParty.id);
        const songPointer = Songs.createWithoutData(songId);
        
        // Query for existing vote from this user for this song
        const query = new Parse.Query(Thumbs);
        query.equalTo('whoseVote', state.currentUser);
        query.equalTo('whichParty', partyPointer);
        query.equalTo('songDeets', songPointer);
        
        let vote = await query.first();
        const hadExistingVoteRecord = !!vote;
        
        if (!vote) {
            vote = new Thumbs();
            vote.set('whoseVote', state.currentUser);
            vote.set('whichParty', partyPointer);
            vote.set('songDeets', songPointer);
        }

        vote.set('thumbsUp', state.pendingCounterVotes.up || 0);
        vote.set('thumbsMid', state.pendingCounterVotes.mid || 0);
        vote.set('thumbsDown', state.pendingCounterVotes.down || 0);
        
        await vote.save();
        
        state.songVotesMap[songId] = { ...state.pendingCounterVotes };
        state.existingCounterVotes = { ...state.pendingCounterVotes };
        
        updateSongVoteDisplay(songId);
        elements.voteStatus.textContent = hadExistingVoteRecord ? 'Votes updated!' : 'Votes submitted!';

        const submitBtn = document.getElementById('counter-submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Update';
        }
    } catch (error) {
        console.error('Error saving counter votes:', error);
        elements.voteStatus.textContent = 'Error saving votes';
    }
}

// Update the vote display for a specific song in the list
function updateSongVoteDisplay(songId) {
    const songItem = document.querySelector(`.song-item[data-song-id="${songId}"]`);
    if (songItem) {
        const voteEl = songItem.querySelector('.song-vote');
        if (voteEl) {
            const votes = state.songVotesMap[songId] || { up: 0, mid: 0, down: 0 };
            const guestVoting = state.currentParty.get('GuestVoting') !== false;
            voteEl.textContent = getVoteDisplay(votes, guestVoting);
        }
    }
}

// Load existing vote for a specific song
async function loadSongVote(song) {
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        const Parties = Parse.Object.extend('Parties');
        const partyPointer = Parties.createWithoutData(state.currentParty.id);
        
        const Songs = Parse.Object.extend('Songs');
        const songPointer = Songs.createWithoutData(song.id);
        
        const query = new Parse.Query(Thumbs);
        query.equalTo('whoseVote', state.currentUser);
        query.equalTo('whichParty', partyPointer);
        query.equalTo('songDeets', songPointer);
        
        const vote = await query.first();
        
        // Update UI
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (vote) {
            state.currentUserVote = vote;
            const up = vote.get('thumbsUp') || 0;
            const mid = vote.get('thumbsMid') || 0;
            const down = vote.get('thumbsDown') || 0;
            
            let voteValue = 'middle';
            if (up > 0) voteValue = 'up';
            else if (down > 0) voteValue = 'down';
            
            const btn = document.querySelector(`.vote-btn[data-vote="${voteValue}"]`);
            if (btn) {
                btn.classList.add('selected');
            }
            elements.voteStatus.textContent = `You voted: ${getVoteEmoji(voteValue)}`;
        } else {
            state.currentUserVote = null;
            elements.voteStatus.textContent = 'No vote yet for this song';
        }
    } catch (error) {
        console.error('Error loading song vote:', error);
    }
}

// Convert country code to flag emoji
function getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    
    const code = countryCode.toUpperCase();
    const offset = 127397; // Regional indicator symbol offset
    
    try {
        const flag = String.fromCodePoint(
            code.charCodeAt(0) + offset,
            code.charCodeAt(1) + offset
        );
        return flag;
    } catch (e) {
        return '🏳️';
    }
}

async function loadUserVote() {
    // Reset selected song when entering party screen
    state.selectedSong = null;
    
    // Reset voting header and show initial message
    const votingSection = document.querySelector('.voting-section h3');
    if (votingSection) {
        votingSection.textContent = 'Cast Your Vote';
    }
    
    // Replace vote buttons with instruction message when no country is selected
    const voteButtonsContainer = document.querySelector('.vote-buttons');
    if (voteButtonsContainer) {
        voteButtonsContainer.innerHTML = '<p class="select-country-msg">Click on a Country below to start voting.</p>';
    }
    
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        const query = new Parse.Query(Thumbs);
        query.equalTo('whoseVote', state.currentUser);
        query.equalTo('whichParty', state.currentParty);
        query.doesNotExist('songDeets'); // Get votes not tied to specific songs
        
        const vote = await query.first();
        
        // Update UI
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (vote) {
            state.currentUserVote = vote;
            // Determine which button to highlight based on counts
            const up = vote.get('thumbsUp') || 0;
            const mid = vote.get('thumbsMid') || 0;
            const down = vote.get('thumbsDown') || 0;
            
            let voteValue = 'middle';
            if (up > 0) voteValue = 'up';
            else if (down > 0) voteValue = 'down';
            
            const btn = document.querySelector(`.vote-btn[data-vote="${voteValue}"]`);
            if (btn) {
                btn.classList.add('selected');
            }
            elements.voteStatus.textContent = `You voted: ${getVoteEmoji(voteValue)}`;
        } else {
            state.currentUserVote = null;
            elements.voteStatus.textContent = '';
        }
    } catch (error) {
        console.error('Error loading vote:', error);
    }
}

async function handleVote(voteValue) {
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        const Parties = Parse.Object.extend('Parties');
        const partyPointer = Parties.createWithoutData(state.currentParty.id);
        let vote;
        
        // Check if we're voting for a specific song
        const isVotingForSong = state.selectedSong !== null;
        
        if (isVotingForSong) {
            // When voting for a song, check if we already have a vote for THIS specific song
            if (state.currentUserVote && state.currentUserVote.get('songDeets') && 
                state.currentUserVote.get('songDeets').id === state.selectedSong.id) {
                // Update existing vote for this song
                vote = state.currentUserVote;
            } else {
                // Create new vote for this song
                vote = new Thumbs();
                vote.set('whoseVote', state.currentUser);
                vote.set('whichParty', partyPointer);
                const comp = state.currentParty.get('whichComp');
                if (comp) {
                    vote.set('whichComp', comp);
                }
                const Songs = Parse.Object.extend('Songs');
                const songPointer = Songs.createWithoutData(state.selectedSong.id);
                vote.set('songDeets', songPointer);
            }
        } else if (state.currentUserVote) {
            // Update existing vote (general party vote, not song-specific)
            vote = state.currentUserVote;
        } else {
            // Create new general party vote
            vote = new Thumbs();
            vote.set('whoseVote', state.currentUser);
            vote.set('whichParty', partyPointer);
            const comp = state.currentParty.get('whichComp');
            if (comp) {
                vote.set('whichComp', comp);
            }
        }
        
        // Reset all counts
        vote.set('thumbsUp', 0);
        vote.set('thumbsMid', 0);
        vote.set('thumbsDown', 0);
        
        // Set the selected vote
        if (voteValue === 'up') {
            vote.set('thumbsUp', 1);
        } else if (voteValue === 'middle') {
            vote.set('thumbsMid', 1);
        } else if (voteValue === 'down') {
            vote.set('thumbsDown', 1);
        }
        
        await vote.save();
        
        // Update UI
        state.currentUserVote = vote;
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        const btn = document.querySelector(`.vote-btn[data-vote="${voteValue}"]`);
        if (btn) {
            btn.classList.add('selected');
        }
        
        elements.voteStatus.textContent = `Vote saved: ${getVoteEmoji(voteValue)}`;
        
        // If we voted for a song, refresh the songs list to show updated vote
        if (isVotingForSong) {
            await refreshSongVoteDisplay(state.selectedSong.id, voteValue);
        }
        
        // Refresh scoreboard
        await loadScoreboard();
        
    } catch (error) {
        console.error('Error saving vote:', error);
        elements.voteStatus.textContent = 'Failed to save vote';
    }
}

// Refresh the vote display for a specific song after voting
async function refreshSongVoteDisplay(songId, voteValue) {
    const party = state.currentParty;
    const guestVoting = party.get('GuestVoting') !== false;
    
    const songItem = document.querySelector(`.song-item[data-song-id="${songId}"]`);
    if (!songItem) return;
    
    const voteDisplay = songItem.querySelector('.song-vote');
    if (!voteDisplay) return;
    
    if (guestVoting) {
        // Show user's own vote
        voteDisplay.textContent = getVoteEmoji(voteValue);
    } else {
        // Reload all votes and update display
        const songVotesMap = await loadAllSongVotes(state.allSongs);
        const vote = songVotesMap[songId];
        voteDisplay.textContent = getVoteDisplay(vote, false);
    }
}

async function loadMainScoreboard({ runRefreshAnimation = false } = {}) {
    const sourceType = elements.mainScoreboardSourceSelect.value;
    if (!elements.mainScoreboardContent.querySelector('.main-scoreboard-layout')) {
        elements.mainScoreboardContent.innerHTML = '<p class="loading">Loading rankings...</p>';
    }

    if (!sourceType) {
        elements.mainScoreboardContent.innerHTML = '<p class="loading">Choose a source to view the scoreboard.</p>';
        elements.mainScoreboardContext.style.display = 'none';
        return;
    }

    elements.mainRefreshScoresBtn.disabled = true;
    elements.mainRefreshScoresBtn.classList.add('is-loading');
    elements.mainRefreshScoresBtn.setAttribute('aria-busy', 'true');

    try {
        let songs = [];
        let votes = [];
        let partyLabel = '';
        let stageLabel = '';

        if (sourceType === 'party') {
            const partyId = elements.mainScoreboardPartySelect.value;
            if (!partyId) {
                elements.mainScoreboardContent.innerHTML = '<p class="loading">Select a party to continue.</p>';
                return;
            }

            const party = getAllUserParties().find(p => p.id === partyId);
            if (!party) {
                elements.mainScoreboardContent.innerHTML = '<p class="error-message">Unable to find selected party.</p>';
                return;
            }

            const competition = party.get('whichComp');
            if (!competition) {
                elements.mainScoreboardContent.innerHTML = '<p class="loading">This party has no linked competition.</p>';
                return;
            }

            songs = await fetchSongsForCompetition(competition);
            votes = await fetchScoreboardVotes({ partyId });
            partyLabel = `Party: ${party.get('Name') || 'Unnamed Party'}`;
            stageLabel = `Stage: ${getCompetitionLabel(competition)}`;
        } else if (sourceType === 'competition') {
            const competitionId = elements.mainScoreboardCompetitionSelect.value;
            if (!competitionId) {
                elements.mainScoreboardContent.innerHTML = '<p class="loading">Select a competition to continue.</p>';
                return;
            }

            let competition = state.competitions.find(comp => comp.id === competitionId);
            if (!competition) {
                const Competitions = Parse.Object.extend('Competitions');
                const query = new Parse.Query(Competitions);
                competition = await query.get(competitionId);
            }

            songs = await fetchSongsForCompetition(competition);
            votes = await fetchScoreboardVotes({ competitionId });
            partyLabel = 'Party: All Parties';
            stageLabel = `Stage: ${getCompetitionLabel(competition)}`;
        }

        const scoreboardData = buildMainScoreboardData(votes, songs);
        await renderMainEurovisionScoreboard(scoreboardData, { runRefreshAnimation });

        const contextLabel = [partyLabel, stageLabel].filter(Boolean).join(' • ');
        elements.mainScoreboardContext.textContent = contextLabel;
        elements.mainScoreboardContext.style.display = contextLabel ? 'block' : 'none';
        recalculateMainScoreboardCellSizing();
    } catch (error) {
        console.error('Error loading main scoreboard:', error);
        elements.mainScoreboardContent.innerHTML = '<p class="error-message">Failed to load scoreboard</p>';
    } finally {
        elements.mainRefreshScoresBtn.disabled = false;
        elements.mainRefreshScoresBtn.classList.remove('is-loading');
        elements.mainRefreshScoresBtn.removeAttribute('aria-busy');
    }
}

function getCompetitionLabel(competition) {
    if (!competition) return 'Unknown competition';
    const stage = competition.get('stage') || competition.get('Stage') || '';
    const year = competition.get('year') || competition.get('Year') || '';
    return `${stage} ${year}`.trim() || 'Unnamed competition';
}

async function fetchScoreboardVotes({ partyId, competitionId }) {
    const Thumbs = Parse.Object.extend('Thumbs');
    const query = new Parse.Query(Thumbs);
    query.include('songDeets');
    query.limit(SCOREBOARD_QUERY_LIMIT);

    if (partyId) {
        const Parties = Parse.Object.extend('Parties');
        query.equalTo('whichParty', Parties.createWithoutData(partyId));
    } else if (competitionId) {
        const Competitions = Parse.Object.extend('Competitions');
        query.equalTo('whichComp', Competitions.createWithoutData(competitionId));
    }

    return query.find();        
}

function buildCountryRankings(votes, songs) {
    const countryScores = {};
    const songDataMap = {};

    (songs || []).forEach(song => {
        songDataMap[song.id] = song;
        const countryName = song.get('countryName') || song.get('CountryName') || 'Unknown';

        if (!countryScores[countryName]) {
            countryScores[countryName] = {
                countryName,
                countryCode: song.get('countryCode') || song.get('CountryCode') || '',
                singer: song.get('singer') || song.get('Singer') || '',
                songTitle: song.get('song') || song.get('Song') || '',
                up: 0,
                mid: 0,
                down: 0,
                totalVotes: 0
            };
        }
    });

    (votes || []).forEach(vote => {
        const songPointer = vote.get('songDeets');
        if (!songPointer) return;

        const song = songDataMap[songPointer.id] || songPointer;
        const countryName = song.get('countryName') || song.get('CountryName') || 'Unknown';
        const up = vote.get('thumbsUp') || 0;
        const mid = vote.get('thumbsMid') || 0;
        const down = vote.get('thumbsDown') || 0;

        if (!countryScores[countryName]) {
            countryScores[countryName] = {
                countryName,
                countryCode: song.get('countryCode') || song.get('CountryCode') || '',
                singer: song.get('singer') || song.get('Singer') || '',
                songTitle: song.get('song') || song.get('Song') || '',
                up: 0,
                mid: 0,
                down: 0,
                totalVotes: 0
            };
        }

        countryScores[countryName].up += up;
        countryScores[countryName].mid += mid;
        countryScores[countryName].down += down;
        countryScores[countryName].totalVotes += up + mid + down;
    });

    const rankings = Object.values(countryScores).map(country => ({
        ...country,
        rawScore: country.totalVotes > 0
            ? (country.up - country.down) / country.totalVotes
            : 0
    }));

    if (rankings.length === 0) return [];

    rankings.sort((a, b) => {
        if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
        if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
        if (b.up !== a.up) return b.up - a.up;
        if (a.down !== b.down) return a.down - b.down;
        return a.countryName.localeCompare(b.countryName);
    });

    rankings.forEach(country => {
        country.displayScore = country.rawScore + 1;
    });

    const numCountries = rankings.length;
    const sumOfScores = rankings.reduce((sum, country) => sum + country.displayScore, 0);

    rankings.forEach(country => {
        country.points = sumOfScores > 0
            ? Math.round((country.displayScore / sumOfScores) * (EUROVISION_POINTS_MULTIPLIER * numCountries))
            : 0;
    });

    return rankings;
}

function buildMainScoreboardData(votes, songs) {
    const rankings = buildCountryRankings(votes, songs);
    const rankingByCountry = new Map(rankings.map(country => [country.countryName, country]));
    const countriesByOrder = [];
    const countryMap = new Map();

    (songs || []).forEach((song, index) => {
        const countryName = song.get('countryName') || song.get('CountryName') || 'Unknown';
        if (countryMap.has(countryName)) {
            return;
        }

        const country = {
            countryName,
            countryCode: song.get('countryCode') || song.get('CountryCode') || '',
            singer: song.get('singer') || song.get('Singer') || '',
            songTitle: song.get('song') || song.get('Song') || '',
            performanceOrder: index + 1
        };

        countryMap.set(countryName, country);
        countriesByOrder.push(country);
    });

    const votedCountries = rankings.filter(country => country.totalVotes > 0);
    const unvotedCountries = countriesByOrder.filter(country => {
        const rankedCountry = rankingByCountry.get(country.countryName);
        return !rankedCountry || rankedCountry.totalVotes === 0;
    });

    return {
        votedCountries,
        unvotedCountries,
        nextPerformer: unvotedCountries[0] || null
    };
}

function renderMainScoreboardRows(countries) {
    if (!countries || countries.length === 0) {
        return '<p class="loading">No countries have received votes yet.</p>';
    }

    return countries.map((country, index) => {
        if (!country) {
            return `<div class="main-scoreboard-row main-scoreboard-row-placeholder" data-slot="${index + 1}"></div>`;
        }

        const flag = country.countryCode ? getCountryFlag(country.countryCode) : '🏳️';
        const singer = escapeHtml(country.singer || MAIN_SCOREBOARD_SINGER_PLACEHOLDER);
        const songTitle = escapeHtml(country.songTitle || MAIN_SCOREBOARD_SONG_PLACEHOLDER);

        return `
            <div class="main-scoreboard-row" data-country="${escapeHtml(country.countryName)}">
                <div class="main-scoreboard-rank">${country.rank || (index + 1)}</div>
                <div class="main-scoreboard-flag" aria-hidden="true">${flag}</div>
                <div class="main-scoreboard-country-block">
                    <div class="main-scoreboard-country-line">
                        <span class="main-scoreboard-country">${escapeHtml(country.countryName)}</span>
                    </div>
                    <div class="main-scoreboard-songline">${singer} • ${songTitle}</div>
                </div>
                <div class="main-scoreboard-points">${country.points || 0}</div>
            </div>
        `;
    }).join('');
}

function arrangeForVerticalColumns(countries, columnCount = 2) {
    if (!Array.isArray(countries) || countries.length <= 1 || columnCount < 2) {
        return countries || [];
    }

    const rowsPerColumn = Math.ceil(countries.length / columnCount);
    const ordered = [];
    for (let rowIndex = 0; rowIndex < rowsPerColumn; rowIndex += 1) {
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            const sourceIndex = rowIndex + (columnIndex * rowsPerColumn);
            if (sourceIndex < countries.length) {
                ordered.push(countries[sourceIndex]);
            }
        }
    }

    return ordered;
}

function renderMainStagingRows(countries) {
    if (!countries.length) {
        return '<p class="loading">No countries waiting to perform.</p>';
    }

    return countries.map(country => {
        const flag = country.countryCode ? getCountryFlag(country.countryCode) : '🏳️';
        return `
            <div class="main-scoreboard-staging-country" data-flag="${flag}" data-country="${escapeHtml(country.countryName)}">
                <div class="main-scoreboard-staging-order">#${country.performanceOrder}</div>
                <div class="main-scoreboard-staging-country-name">${escapeHtml(country.countryName)}</div>
                <div class="main-scoreboard-staging-singer">${escapeHtml(country.singer || MAIN_SCOREBOARD_SINGER_PLACEHOLDER)}</div>
                <div class="main-scoreboard-staging-song">${escapeHtml(country.songTitle || MAIN_SCOREBOARD_SONG_PLACEHOLDER)}</div>
            </div>
        `;
    }).join('');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getMainScoreboardGap(availableHeight, rowsPerColumn) {
    if (!availableHeight || !rowsPerColumn) {
        return 8;
    }

    return clamp(Math.floor(availableHeight / Math.max(rowsPerColumn * 14, 1)), 4, 8);
}

function applyMainScoreboardRowSizing(container) {
    if (!container) {
        return;
    }

    const cellCount = container.querySelectorAll('.main-scoreboard-row').length;
    if (!cellCount) {
        return;
    }

    const rowsPerColumn = Math.ceil(cellCount / MAIN_SCOREBOARD_COLUMN_COUNT);
    const availableHeight = container.clientHeight;
    if (!availableHeight || !rowsPerColumn) {
        return;
    }

    const gap = getMainScoreboardGap(availableHeight, rowsPerColumn);
    const rowHeight = clamp(
        Math.floor((availableHeight - (gap * Math.max(rowsPerColumn - 1, 0))) / rowsPerColumn),
        MAIN_SCOREBOARD_MIN_ROW_HEIGHT_PX,
        MAIN_SCOREBOARD_MAX_ROW_HEIGHT_PX
    );
    const compactness = clamp(
        (rowHeight - MAIN_SCOREBOARD_MIN_ROW_HEIGHT_PX) / (MAIN_SCOREBOARD_MAX_ROW_HEIGHT_PX - MAIN_SCOREBOARD_MIN_ROW_HEIGHT_PX),
        0,
        1
    );

    container.style.setProperty('--main-scoreboard-row-gap', `${gap}px`);
    container.style.setProperty('--main-scoreboard-row-height', `${rowHeight}px`);
    container.style.setProperty('--main-scoreboard-row-padding-y', `${Math.round(4 + (compactness * 6))}px`);
    container.style.setProperty('--main-scoreboard-row-padding-x', `${Math.round(6 + (compactness * 6))}px`);
    container.style.setProperty('--main-scoreboard-row-inner-gap', `${Math.round(5 + (compactness * 5))}px`);
    container.style.setProperty('--main-scoreboard-rank-width', `${Math.round(14 + (compactness * 8))}px`);
    container.style.setProperty('--main-scoreboard-rank-font-size', `${(0.62 + (compactness * 0.23)).toFixed(2)}rem`);
    container.style.setProperty('--main-scoreboard-flag-width', `${Math.round(24 + (compactness * 24))}px`);
    container.style.setProperty('--main-scoreboard-flag-font-size', `${(1 + (compactness * 1.2)).toFixed(2)}rem`);
    container.style.setProperty('--main-scoreboard-country-font-size', `${(0.62 + (compactness * 0.28)).toFixed(2)}rem`);
    container.style.setProperty('--main-scoreboard-song-font-size', `${(0.46 + (compactness * 0.34)).toFixed(2)}rem`);
    container.style.setProperty('--main-scoreboard-points-width', `${Math.round(28 + (compactness * 18))}px`);
    container.style.setProperty('--main-scoreboard-points-font-size', `${(0.62 + (compactness * 0.33)).toFixed(2)}rem`);
    container.style.setProperty('--main-scoreboard-points-padding-y', `${Math.max(2, Math.round(2 + (compactness * 2)))}px`);
    container.style.setProperty('--main-scoreboard-points-padding-x', `${Math.max(4, Math.round(4 + (compactness * 4)))}px`);
}

function applyMainStagingTileSizing(container) {
    if (!container) {
        return;
    }

    const cellCount = container.querySelectorAll('.main-scoreboard-staging-country').length;
    if (!cellCount) {
        return;
    }

    const rowsPerColumn = Math.ceil(cellCount / MAIN_SCOREBOARD_COLUMN_COUNT);
    const availableHeight = container.clientHeight;
    if (!availableHeight || !rowsPerColumn) {
        return;
    }

    const gap = getMainScoreboardGap(availableHeight, rowsPerColumn);
    const tileHeight = clamp(
        Math.floor((availableHeight - (gap * Math.max(rowsPerColumn - 1, 0))) / rowsPerColumn),
        MAIN_STAGING_MIN_TILE_HEIGHT_PX,
        MAIN_STAGING_MAX_TILE_HEIGHT_PX
    );
    const compactness = clamp(
        (tileHeight - MAIN_STAGING_MIN_TILE_HEIGHT_PX) / (MAIN_STAGING_MAX_TILE_HEIGHT_PX - MAIN_STAGING_MIN_TILE_HEIGHT_PX),
        0,
        1
    );
    const flagSize = Math.round(28 + (compactness * 28));
    const flagOffset = Math.round(6 + (compactness * 2));
    const flagSpace = flagSize + flagOffset + 10;

    container.style.setProperty('--main-staging-grid-gap', `${gap}px`);
    container.style.setProperty('--main-staging-tile-height', `${tileHeight}px`);
    container.style.setProperty('--main-staging-padding-y', `${Math.round(4 + (compactness * 4))}px`);
    container.style.setProperty('--main-staging-padding-left', `${Math.round(6 + (compactness * 2))}px`);
    container.style.setProperty('--main-staging-flag-space', `${flagSpace}px`);
    container.style.setProperty('--main-staging-flag-right', `${flagOffset}px`);
    container.style.setProperty('--main-staging-flag-size', `${flagSize}px`);
    container.style.setProperty('--main-staging-flag-font-size', `${(1 + (compactness * 1)).toFixed(2)}rem`);
    container.style.setProperty('--main-staging-order-font-size', `${(0.5 + (compactness * 0.24)).toFixed(2)}rem`);
    container.style.setProperty('--main-staging-country-font-size', `${(0.62 + (compactness * 0.28)).toFixed(2)}rem`);
    container.style.setProperty('--main-staging-meta-font-size', `${(0.5 + (compactness * 0.25)).toFixed(2)}rem`);
}

function recalculateMainScoreboardCellSizing() {
    if (!elements.mainScoreboardContent.querySelector('.main-scoreboard-layout')) {
        return;
    }

    applyMainScoreboardRowSizing(elements.mainScoreboardContent.querySelector('.main-scoreboard-rows'));
    applyMainStagingTileSizing(elements.mainScoreboardContent.querySelector('.main-scoreboard-staging-grid'));
}

async function animateMainScoreboardRows(container, countries, durationMs) {
    const previousPositions = new Map();
    container.querySelectorAll('.main-scoreboard-row[data-country]').forEach(row => {
        previousPositions.set(row.dataset.country, row.getBoundingClientRect());
    });

    container.innerHTML = renderMainScoreboardRows(countries);
    recalculateMainScoreboardCellSizing();
    if (!countries || !countries.length) {
        return;
    }

    container.querySelectorAll('.main-scoreboard-row[data-country]').forEach(row => {
        const previousPosition = previousPositions.get(row.dataset.country);
        if (!previousPosition) {
            row.classList.add('main-scoreboard-row-new');
            // Use double RAF so the opacity-0 state is painted before removing the class.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => row.classList.remove('main-scoreboard-row-new'));
            });
            return;
        }

        const nextPosition = row.getBoundingClientRect();
        const deltaX = previousPosition.left - nextPosition.left;
        const deltaY = previousPosition.top - nextPosition.top;
        if (!deltaX && !deltaY) {
            return;
        }

        row.style.transition = 'none';
        row.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        requestAnimationFrame(() => {
            row.style.transition = `transform ${durationMs}ms ease`;
            row.style.transform = 'translate(0, 0)';
        });
        const cleanupRowAnimation = () => {
            row.style.transition = '';
            row.style.transform = '';
        };

        const cleanupTimeout = setTimeout(() => {
            row.removeEventListener('transitionend', handleAnimationEnd);
            cleanupRowAnimation();
        }, durationMs + 50);

        function handleAnimationEnd(event) {
            if (event.propertyName !== 'transform') {
                return;
            }
            clearTimeout(cleanupTimeout);
            row.removeEventListener('transitionend', handleAnimationEnd);
            cleanupRowAnimation();
        }

        row.addEventListener('transitionend', handleAnimationEnd);
    });

    await wait(durationMs);
}

async function animateMainStagingRows(container, countries, durationMs) {
    const previousPositions = new Map();
    container.querySelectorAll('.main-scoreboard-staging-country').forEach(countryCard => {
        previousPositions.set(countryCard.dataset.country, countryCard.getBoundingClientRect());
    });

    container.innerHTML = renderMainStagingRows(countries);
    recalculateMainScoreboardCellSizing();
    if (!countries || !countries.length) {
        return;
    }

    container.querySelectorAll('.main-scoreboard-staging-country').forEach(countryCard => {
        const previousPosition = previousPositions.get(countryCard.dataset.country);
        if (!previousPosition) {
            countryCard.classList.add('main-scoreboard-row-new');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => countryCard.classList.remove('main-scoreboard-row-new'));
            });
            return;
        }

        const nextPosition = countryCard.getBoundingClientRect();
        const deltaX = previousPosition.left - nextPosition.left;
        const deltaY = previousPosition.top - nextPosition.top;
        if (!deltaX && !deltaY) {
            return;
        }

        countryCard.style.transition = 'none';
        countryCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        requestAnimationFrame(() => {
            countryCard.style.transition = `transform ${durationMs}ms ease`;
            countryCard.style.transform = 'translate(0, 0)';
        });
    });

    await wait(durationMs);
}

async function renderMainEurovisionScoreboard(scoreboardData, { runRefreshAnimation = false } = {}) {
    const { votedCountries, unvotedCountries, nextPerformer } = scoreboardData || {};
    if (!scoreboardData) {
        elements.mainScoreboardContent.innerHTML = '<p class="loading">No song votes found for this selection.</p>';
        return;
    }

    if (!elements.mainScoreboardContent.querySelector('.main-scoreboard-layout')) {
        elements.mainScoreboardContent.innerHTML = `
        <div class="main-scoreboard-layout">
            <div class="main-scoreboard-panel main-scoreboard-panel-left">
                <h4 class="main-scoreboard-panel-title">Scoreboard</h4>
                <div class="main-scoreboard-rows"></div>
            </div>
            <div class="main-scoreboard-panel main-scoreboard-panel-right">
                <h4 class="main-scoreboard-panel-title">Staging Area</h4>
                <div class="main-scoreboard-next-performer"></div>
                <div class="main-scoreboard-staging-grid"></div>
            </div>
        </div>
        `;
    }

    const rowsContainer = elements.mainScoreboardContent.querySelector('.main-scoreboard-rows');
    const nextPerformerContainer = elements.mainScoreboardContent.querySelector('.main-scoreboard-next-performer');
    const stagingGridContainer = elements.mainScoreboardContent.querySelector('.main-scoreboard-staging-grid');
    const rankedVotedCountries = (votedCountries || []).map((country, index) => ({
        ...country,
        rank: index + 1
    }));
    const totalCompetingCountries = (votedCountries || []).length + (unvotedCountries || []).length;
    const scoreboardSlots = [
        ...rankedVotedCountries,
        ...Array.from({ length: Math.max(totalCompetingCountries - rankedVotedCountries.length, 0) }, () => null)
    ];
    const orderedScoreboardSlots = arrangeForVerticalColumns(scoreboardSlots);

    if (nextPerformer) {
        const flag = nextPerformer.countryCode ? getCountryFlag(nextPerformer.countryCode) : '🏳️';
        nextPerformerContainer.innerHTML = `
            <div class="main-scoreboard-next-card">
                <div class="main-scoreboard-next-label">Next to perform</div>
                <div class="main-scoreboard-next-order">Running order #${nextPerformer.performanceOrder}</div>
                <div class="main-scoreboard-next-country">${flag} ${escapeHtml(nextPerformer.countryName)}</div>
                <div class="main-scoreboard-next-meta">${escapeHtml(nextPerformer.singer || MAIN_SCOREBOARD_SINGER_PLACEHOLDER)} • ${escapeHtml(nextPerformer.songTitle || MAIN_SCOREBOARD_SONG_PLACEHOLDER)}</div>
            </div>
        `;
    } else {
        nextPerformerContainer.innerHTML = '<p class="loading">All countries have received votes.</p>';
    }

    const stagingCountries = (unvotedCountries || []).filter(country => {
        return !nextPerformer || country.countryName !== nextPerformer.countryName;
    });
    const orderedStagingCountries = arrangeForVerticalColumns(stagingCountries);

    if (runRefreshAnimation) {
        await animateMainScoreboardRows(rowsContainer, orderedScoreboardSlots, MAIN_SCOREBOARD_ANIMATION_DURATION_MS);
        await animateMainStagingRows(stagingGridContainer, orderedStagingCountries, MAIN_SCOREBOARD_ANIMATION_DURATION_MS);
        recalculateMainScoreboardCellSizing();
        return;
    }

    rowsContainer.innerHTML = renderMainScoreboardRows(orderedScoreboardSlots);
    stagingGridContainer.innerHTML = renderMainStagingRows(orderedStagingCountries);
    recalculateMainScoreboardCellSizing();
}

async function loadScoreboard() {
    elements.scoreboardContent.innerHTML = '<p class="loading">Loading rankings...</p>';
    
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        const Parties = Parse.Object.extend('Parties');
        const partyPointer = Parties.createWithoutData(state.currentParty.id);
        
        const query = new Parse.Query(Thumbs);
        query.equalTo('whichParty', partyPointer);
        query.include('songDeets');
        query.limit(SCOREBOARD_QUERY_LIMIT);
        
        const votes = await query.find();
        
        console.log('=== SCOREBOARD: Thumbs votes loaded from backend ===');
        console.log(`Total votes found: ${votes.length}`);
        console.log('Raw votes data:', votes.map(v => ({
            id: v.id,
            thumbsUp: v.get('thumbsUp'),
            thumbsMid: v.get('thumbsMid'),
            thumbsDown: v.get('thumbsDown'),
            songId: v.get('songDeets')?.id,
            userId: v.get('whoseVote')?.id
        })));

        const rankings = buildCountryRankings(votes, state.allSongs || []);

        console.log('=== SCOREBOARD: Aggregated country rankings ===');
        console.log('Rankings:', rankings);
        
        displayScoreboard(rankings);
        
    } catch (error) {
        console.error('Error loading scoreboard:', error);
        elements.scoreboardContent.innerHTML = '<p class="error-message">Failed to load rankings</p>';
    }
}

function displayScoreboard(rankings) {
    if (rankings.length === 0) {
        elements.scoreboardContent.innerHTML = '<p class="loading">No votes yet. Vote on countries to see rankings!</p>';
        return;
    }
    
    elements.scoreboardContent.innerHTML = '';
    
    rankings.forEach((country, index) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        const flag = country.countryCode ? getCountryFlag(country.countryCode) : '🏳️';
        
        item.innerHTML = `
            <div class="score-rank ${rankClass}">${rank}</div>
            <div class="score-flag">${flag}</div>
            <div class="score-details">
                <div class="score-country">${escapeHtml(country.countryName)}</div>
                <div class="score-song-info">${escapeHtml(country.singer)} - "${escapeHtml(country.songTitle)}"</div>
            </div>
            <div class="score-points">${country.points}</div>
            <div class="score-votes">
                <span>👍 ${country.up}</span>
                <span>👊 ${country.mid}</span>
                <span>👎 ${country.down}</span>
            </div>
        `;
        
        elements.scoreboardContent.appendChild(item);
    });
}

// Utility functions
function generatePartyCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function generateUniquePartyCode() {
    const Parties = Parse.Object.extend('Parties');
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
        code = generatePartyCode();
        
        // Check if password already exists
        const query = new Parse.Query(Parties);
        query.equalTo('Password', code);
        const existing = await query.first();
        
        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }
    
    if (!isUnique) {
        // Fallback to timestamp-based code if random generation fails
        code = Date.now().toString(36).toUpperCase().slice(-6);
    }
    
    return code;
}

function getVoteEmoji(vote) {
    switch (vote) {
        case 'up': return '👍 Thumbs Up';
        case 'middle': return '👊 Thumbs Middle';
        case 'down': return '👎 Thumbs Down';
        default: return '';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Settings functions
function initializeSettings() {
    // Set the radio buttons based on saved settings
    const displayRadios = document.getElementsByName('display-mode');
    displayRadios.forEach(radio => {
        if (radio.value === state.displayMode) {
            radio.checked = true;
        }
    });
    
    const modeRadios = document.getElementsByName('app-mode');
    modeRadios.forEach(radio => {
        if (radio.value === state.appMode) {
            radio.checked = true;
        }
    });
}

async function applyDisplayMode() {
    const selectedMode = document.querySelector('input[name="display-mode"]:checked').value;
    
    try {
        // Save to localStorage
        localStorage.setItem('displayMode', selectedMode);
        state.displayMode = selectedMode;
        
        // Create a dynamic manifest with the selected display mode
        const manifest = createDynamicManifest(selectedMode);
        
        // Create a new manifest blob and URL
        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {type: 'application/json'});
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        // Update the manifest link in the document
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            manifestLink.href = manifestURL;
        }
        
        alert('Display mode updated to ' + selectedMode + '. Please reload the app for changes to take effect.');
        
        // Reload the page after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error updating display mode:', error);
        alert('Error updating display mode. Please try again.');
    }
}

function applyAppMode() {
    const selectedMode = document.querySelector('input[name="app-mode"]:checked').value;
    
    // Save to localStorage
    localStorage.setItem('appMode', selectedMode);
    state.appMode = selectedMode;
    
    // Show success message
    elements.modeStatus.textContent = `App mode changed to: ${selectedMode === 'score-entry' ? 'Score Entry Mode' : 'Scoreboard Mode'}`;
    elements.modeStatus.classList.remove('hidden');
    
    // Apply mode changes to UI
    applyAppModeToUI();
    
    // Hide message after 3 seconds
    setTimeout(() => {
        elements.modeStatus.classList.add('hidden');
    }, 3000);
}

function applyAppModeToUI() {
    if (state.appMode === 'scoreboard') {
        // In Scoreboard mode, when entering a party, automatically go to scoreboard tab
        console.log('App is now in Scoreboard Mode');
    } else {
        // In Score Entry mode, normal behavior
        console.log('App is now in Score Entry Mode');
    }
}
