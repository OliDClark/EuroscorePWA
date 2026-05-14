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

const APP_VERSION = 'v1.0.2';
const SCOREBOARD_QUERY_LIMIT = 10000;
const UPVOTE_WEIGHT = 2;
const EUROVISION_POINTS_MULTIPLIER = 116;

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
    mainRefreshScoresBtn: document.getElementById('main-refresh-scores-btn'),
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
    elements.joinPartyBtn.addEventListener('click', handleJoinParty);
    elements.createPartyBtn.addEventListener('click', handleCreateParty);
    elements.backToMainBtn.addEventListener('click', showMainScreen);
    elements.refreshScoresBtn.addEventListener('click', loadScoreboard);
    elements.mainRefreshScoresBtn.addEventListener('click', loadMainScoreboard);
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
    handleMainScoreboardSourceChange();
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

async function handleJoinParty() {
    const password = elements.partyCodeInput.value.trim().toUpperCase();
    
    elements.joinError.textContent = '';
    
    if (!password) {
        elements.joinError.textContent = 'Please enter a party code';
        return;
    }
    
    elements.joinPartyBtn.disabled = true;
    elements.joinPartyBtn.textContent = 'Joining...';
    
    try {
        // Find party by password
        const Parties = Parse.Object.extend('Parties');
        const query = new Parse.Query(Parties);
        query.equalTo('Password', password);
        
        const party = await query.first();
        
        if (!party) {
            elements.joinError.textContent = 'Party not found';
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

// QR Code state
let html5QrCode = null;
let isProcessingScan = false;

// Show QR code modal for a party
function showQRModal(party) {
    const name = party.get('Name');
    const password = party.get('Password');
    const payload = `euroscore:${password}`;

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

    const partyCode = decodedText.substring(prefix.length);
    elements.partyCodeInput.value = partyCode;
    await handleJoinParty();
    isProcessingScan = false;
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
        
        // Re-attach event listeners
        voteButtonsContainer.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => castVote(btn.dataset.vote));
        });
    }
}

// Show the counter voting interface with +/- buttons (when GuestVoting is false)
async function showCounterVotingInterface(song) {
    // Load aggregated votes for this specific song
    const votes = state.songVotesMap[song.id] || { up: 0, mid: 0, down: 0 };
    
    const voteButtonsContainer = document.querySelector('.vote-buttons');
    if (voteButtonsContainer) {
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
        `;
        
        // Attach event listeners for +/- buttons
        voteButtonsContainer.querySelectorAll('.counter-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => adjustVoteCount(btn.dataset.type, 1));
        });
        voteButtonsContainer.querySelectorAll('.counter-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => adjustVoteCount(btn.dataset.type, -1));
        });
    }
    
    elements.voteStatus.textContent = 'Tap + or - to adjust vote counts';
}

// Adjust vote count (for counter interface when GuestVoting is false)
async function adjustVoteCount(type, delta) {
    if (!state.selectedSong || !state.currentParty) {
        console.error('No song or party selected');
        return;
    }
    
    const song = state.selectedSong;
    const songId = song.id;
    
    // Update the local counter display
    const counterEl = document.getElementById(`counter-${type}`);
    if (counterEl) {
        let currentValue = parseInt(counterEl.textContent) || 0;
        currentValue = Math.max(0, currentValue + delta); // Don't go below 0
        counterEl.textContent = currentValue;
    }
    
    // Save to Parse Server - create or update vote object
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
        
        if (!vote) {
            // Create new vote object
            vote = new Thumbs();
            vote.set('whoseVote', state.currentUser);
            vote.set('whichParty', partyPointer);
            vote.set('songDeets', songPointer);
            vote.set('thumbsUp', 0);
            vote.set('thumbsMid', 0);
            vote.set('thumbsDown', 0);
        }
        
        // Determine which field to update
        let fieldName;
        switch (type) {
            case 'up': fieldName = 'thumbsUp'; break;
            case 'mid': fieldName = 'thumbsMid'; break;
            case 'down': fieldName = 'thumbsDown'; break;
            default: return;
        }
        
        // Update the count (don't go below 0)
        const newValue = Math.max(0, (vote.get(fieldName) || 0) + delta);
        vote.set(fieldName, newValue);
        
        await vote.save();
        
        // Update state songVotesMap
        if (!state.songVotesMap[songId]) {
            state.songVotesMap[songId] = { up: 0, mid: 0, down: 0 };
        }
        state.songVotesMap[songId][type] = newValue;
        
        // Update the song item display
        updateSongVoteDisplay(songId);
        
        elements.voteStatus.textContent = 'Vote updated!';
    } catch (error) {
        console.error('Error adjusting vote count:', error);
        elements.voteStatus.textContent = 'Error saving vote';
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

async function loadMainScoreboard() {
    const sourceType = elements.mainScoreboardSourceSelect.value;
    elements.mainScoreboardContent.innerHTML = '<p class="loading">Loading rankings...</p>';
    elements.mainScoreboardContext.style.display = 'none';

    if (!sourceType) {
        elements.mainScoreboardContent.innerHTML = '<p class="loading">Choose a source to view the scoreboard.</p>';
        return;
    }

    try {
        let songs = [];
        let votes = [];
        let contextLabel = '';

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
            contextLabel = `Party: ${party.get('Name') || 'Unnamed Party'} • ${getCompetitionLabel(competition)}`;
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
            contextLabel = `Competition: ${getCompetitionLabel(competition)}`;
        }

        const rankings = buildCountryRankings(votes, songs);
        renderMainEurovisionScoreboard(rankings);

        elements.mainScoreboardContext.textContent = contextLabel;
        elements.mainScoreboardContext.style.display = contextLabel ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading main scoreboard:', error);
        elements.mainScoreboardContent.innerHTML = '<p class="error-message">Failed to load scoreboard</p>';
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

    songs.forEach(song => {
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

    votes.forEach(vote => {
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
        rawScore: (country.totalVotes > 0 ? ((country.up * UPVOTE_WEIGHT) - country.down) / country.totalVotes : 0) + Math.random()
    }));

    if (rankings.length === 0) return [];

    const minScore = Math.min(...rankings.map(c => c.rawScore));
    if (minScore < 0) {
        const offset = Math.abs(minScore);
        rankings.forEach(country => {
            country.rawScore += offset;
        });
    }

    rankings.sort((a, b) => b.rawScore - a.rawScore);

    const numCountries = rankings.length;
    const sumOfScores = rankings.reduce((sum, country) => sum + country.rawScore, 0);
    rankings.forEach(country => {
        country.points = sumOfScores > 0
            ? Math.round((country.rawScore / sumOfScores) * (EUROVISION_POINTS_MULTIPLIER * numCountries))
            : 0;
    });

    return rankings;
}

function renderMainEurovisionScoreboard(rankings) {
    if (!rankings || rankings.length === 0) {
        elements.mainScoreboardContent.innerHTML = '<p class="loading">No song votes found for this selection.</p>';
        return;
    }

    const midpoint = Math.ceil(rankings.length / 2);
    const left = rankings.slice(0, midpoint);
    const right = rankings.slice(midpoint);

    const renderRows = (rows, offset) => rows.map((country, index) => {
        const rank = offset + index + 1;
        const flag = country.countryCode ? getCountryFlag(country.countryCode) : '🏳️';
        return `
            <div class="eurovision-score-row">
                <div class="eurovision-score-country">
                    <span class="eurovision-score-rank">${rank}</span>
                    <span class="eurovision-score-flag">${flag}</span>
                    <span class="eurovision-score-name">${escapeHtml(country.countryName)}</span>
                </div>
                <div class="eurovision-score-points">${country.points}</div>
            </div>
        `;
    }).join('');

    elements.mainScoreboardContent.innerHTML = `
        <div class="eurovision-scoreboard-grid">
            <div class="eurovision-scoreboard-column">${renderRows(left, 0)}</div>
            <div class="eurovision-scoreboard-column">${renderRows(right, midpoint)}</div>
        </div>
    `;
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
        query.limit(SCOREBOARD_QUERY_LIMIT); // Set high limit to capture all votes for large parties
        
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
        
        // Initialize scores from all songs loaded in the party
        const countryScores = {};
        
        // First, add all songs to the scoreboard with 0 votes
        if (state.allSongs && state.allSongs.length > 0) {
            state.allSongs.forEach(song => {
                const countryName = song.get('countryName') || song.get('CountryName') || 'Unknown';
                const countryCode = song.get('countryCode') || song.get('CountryCode') || '';
                const singer = song.get('singer') || song.get('Singer') || '';
                const songTitle = song.get('song') || song.get('Song') || '';
                
                if (!countryScores[countryName]) {
                    countryScores[countryName] = {
                        countryName: countryName,
                        countryCode: countryCode,
                        singer: singer,
                        songTitle: songTitle,
                        up: 0,
                        mid: 0,
                        down: 0,
                        totalVotes: 0
                    };
                }
            });
        }
        
        // Aggregate votes by country (via song)
        // Use allSongs to map songDeets to full song data since include doesn't always fetch all fields
        const songDataMap = {};
        if (state.allSongs && state.allSongs.length > 0) {
            state.allSongs.forEach(s => {
                songDataMap[s.id] = s;
            });
        }
        
        votes.forEach(vote => {
            const songPointer = vote.get('songDeets');
            if (!songPointer) return;
            
            // Get the full song data from our cached songs if available
            const song = songDataMap[songPointer.id] || songPointer;
            
            const countryName = song.get('countryName') || song.get('CountryName') || 'Unknown';
            const countryCode = song.get('countryCode') || song.get('CountryCode') || '';
            const singer = song.get('singer') || song.get('Singer') || '';
            const songTitle = song.get('song') || song.get('Song') || '';
            const up = vote.get('thumbsUp') || 0;
            const mid = vote.get('thumbsMid') || 0;
            const down = vote.get('thumbsDown') || 0;
            
            if (!countryScores[countryName]) {
                countryScores[countryName] = {
                    countryName: countryName,
                    countryCode: countryCode,
                    singer: singer,
                    songTitle: songTitle,
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
        
        console.log('=== SCOREBOARD: Aggregated country scores ===');
        console.log('Country scores:', countryScores);
        
        // Calculate raw score using formula: (((Thumbs up*2) - Thumbs down) / Total votes + random(0,1))
        const rankings = Object.values(countryScores).map(country => {
            let rawScore = 0;
            if (country.totalVotes > 0) {
                rawScore = ((country.up * UPVOTE_WEIGHT) - country.down) / country.totalVotes;
            }
            // Add random tiebreaker between 0 and 1
            rawScore += Math.random();
            
            return {
                ...country,
                rawScore: rawScore
            };
        });
        
        // Ensure no country has a negative score - add offset if needed
        const minScore = Math.min(...rankings.map(c => c.rawScore));
        if (minScore < 0) {
            const offset = Math.abs(minScore);
            rankings.forEach(country => {
                country.rawScore += offset;
            });
        }
        
        // Sort by rawScore descending
        rankings.sort((a, b) => b.rawScore - a.rawScore);
        
        // Calculate points using formula: (this country's score/sum of all countries' scores) * (116 * number of competing countries)
        const numCountries = rankings.length;
        const sumOfScores = rankings.reduce((sum, country) => sum + country.rawScore, 0);
        
        rankings.forEach(country => {
            if (sumOfScores > 0) {
                country.points = Math.round((country.rawScore / sumOfScores) * (EUROVISION_POINTS_MULTIPLIER * numCountries));
            } else {
                country.points = 0;
            }
        });
        
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
