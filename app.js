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

// State management
const state = {
    currentUser: null,
    currentParty: null,
    userParties: [],
    hostedParties: [],
    joinedParties: [],
    currentUserVote: null
};

// DOM elements cache
const elements = {
    loginScreen: document.getElementById('login-screen'),
    signupScreen: document.getElementById('signup-screen'),
    mainScreen: document.getElementById('main-screen'),
    partyScreen: document.getElementById('party-screen'),
    
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
    
    partyCodeInput: document.getElementById('party-code-input'),
    joinPartyBtn: document.getElementById('join-party-btn'),
    joinError: document.getElementById('join-error'),
    
    partyNameInput: document.getElementById('party-name-input'),
    partyDescriptionInput: document.getElementById('party-description-input'),
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
    songsList: document.getElementById('songs-list')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
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
    const currentUser = Parse.User.current();
    if (currentUser) {
        state.currentUser = currentUser;
        showMainScreen();
    } else {
        showLoginScreen();
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
}

function showPartyScreen(party) {
    state.currentParty = party;
    showScreen(elements.partyScreen);
    updatePartyScreen();
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
    
    // Party actions
    elements.joinPartyBtn.addEventListener('click', handleJoinParty);
    elements.createPartyBtn.addEventListener('click', handleCreateParty);
    elements.backToMainBtn.addEventListener('click', showMainScreen);
    elements.refreshScoresBtn.addEventListener('click', loadScoreboard);
    
    // Voting
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', () => handleVote(btn.dataset.vote));
    });
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
    
    return card;
}

async function handleCreateParty() {
    const name = elements.partyNameInput.value.trim();
    const location = elements.partyDescriptionInput.value.trim();
    
    elements.createError.textContent = '';
    
    if (!name) {
        elements.createError.textContent = 'Please enter a party name';
        return;
    }
    
    elements.createPartyBtn.disabled = true;
    elements.createPartyBtn.textContent = 'Creating...';
    
    try {
        const Parties = Parse.Object.extend('Parties');
        const party = new Parties();
        
        // Generate unique party password with verification
        const password = await generateUniquePartyCode();
        
        party.set('Name', name);
        party.set('Location', location || 'Online');
        party.set('Password', password);
        party.set('Host', state.currentUser);
        party.set('GuestVoting', true);
        
        await party.save();
        
        // Add creator as guest
        const guestsRelation = party.relation('Guests');
        guestsRelation.add(state.currentUser);
        await party.save();
        
        // Refresh parties list
        await loadUserParties();
        
        // Clear form
        elements.partyNameInput.value = '';
        elements.partyDescriptionInput.value = '';
        
        // Show success and switch to parties tab
        switchTab('parties');
        
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

// Party detail screen
async function updatePartyScreen() {
    const party = state.currentParty;
    
    elements.partyTitle.textContent = party.get('Name');
    elements.partyDescription.textContent = party.get('Location') || 'No location';
    elements.partyCodeDisplay.textContent = party.get('Password');
    
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
        // Fetch the competition to get the whereObject
        await competition.fetch();
        
        const whereObject = competition.get('whereObject');
        const stage = competition.get('stage') || competition.get('Stage');
        
        if (!whereObject) {
            elements.songsList.innerHTML = '<p class="error-message">No song filter found for this competition</p>';
            return;
        }
        
        // Parse the whereObject if it's a string
        let queryParams = whereObject;
        if (typeof whereObject === 'string') {
            queryParams = JSON.parse(whereObject);
        }
        
        // Query the Songs class using the whereObject
        const Songs = Parse.Object.extend('Songs');
        const query = new Parse.Query(Songs);
        
        // Apply each constraint from whereObject
        for (const [key, value] of Object.entries(queryParams)) {
            if (typeof value === 'object' && value !== null) {
                // Handle special Parse query operators
                if (value.__type === 'Pointer') {
                    // Handle pointer values
                    const pointerObj = Parse.Object.extend(value.className).createWithoutData(value.objectId);
                    query.equalTo(key, pointerObj);
                } else {
                    // Handle other object constraints like $gt, $lt, etc.
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
        
        // Determine sort order based on stage
        const stageLower = (stage || '').toLowerCase();
        if (stageLower.includes('final') && !stageLower.includes('semi')) {
            query.ascending('finalOrder');
        } else {
            query.ascending('semiOrder');
        }
        
        const songs = await query.find();
        
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

// Display songs list
function displaySongs(songs) {
    elements.songsList.innerHTML = '';
    
    songs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        
        const country = song.get('countryName') || song.get('CountryName') || 'Unknown';
        const countryCode = song.get('countryCode') || song.get('CountryCode') || '';
        const artist = song.get('singer') || song.get('Singer') || 'Unknown Artist';
        const songName = song.get('song') || song.get('Song') || song.get('title') || song.get('Title') || 'Unknown Song';
        
        // Generate flag emoji from country code
        const flag = countryCode ? getCountryFlag(countryCode) : '🏳️';
        
        songItem.innerHTML = `
            <div class="song-order">${index + 1}</div>
            <div class="song-flag">${flag}</div>
            <div class="song-details">
                <div class="song-country">${escapeHtml(country)}</div>
                <div class="song-artist">${escapeHtml(artist)}</div>
                <div class="song-title">${escapeHtml(songName)}</div>
            </div>
        `;
        
        elements.songsList.appendChild(songItem);
    });
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
            elements.voteStatus.textContent = 'You haven\'t voted yet';
        }
    } catch (error) {
        console.error('Error loading vote:', error);
    }
}

async function handleVote(voteValue) {
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        let vote;
        
        if (state.currentUserVote) {
            // Update existing vote
            vote = state.currentUserVote;
        } else {
            // Create new vote
            vote = new Thumbs();
            vote.set('whoseVote', state.currentUser);
            vote.set('whichParty', state.currentParty);
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
        
        // Refresh scoreboard
        await loadScoreboard();
        
    } catch (error) {
        console.error('Error saving vote:', error);
        elements.voteStatus.textContent = 'Failed to save vote';
    }
}

async function loadScoreboard() {
    elements.scoreboardContent.innerHTML = '<p class="loading">Loading scores...</p>';
    
    try {
        const Thumbs = Parse.Object.extend('Thumbs');
        const query = new Parse.Query(Thumbs);
        query.equalTo('whichParty', state.currentParty);
        query.doesNotExist('songDeets'); // Get votes not tied to specific songs
        query.include('whoseVote');
        
        const votes = await query.find();
        
        // Calculate scores
        const scoreMap = {};
        
        votes.forEach(vote => {
            const user = vote.get('whoseVote');
            if (!user) return;
            
            const username = user.get('Name') || user.getUsername();
            const up = vote.get('thumbsUp') || 0;
            const mid = vote.get('thumbsMid') || 0;
            const down = vote.get('thumbsDown') || 0;
            
            if (!scoreMap[username]) {
                scoreMap[username] = {
                    username: username,
                    up: 0,
                    middle: 0,
                    down: 0,
                    total: 0
                };
            }
            
            scoreMap[username].up += up;
            scoreMap[username].middle += mid;
            scoreMap[username].down += down;
            
            // Calculate total: up = +1, middle = 0, down = -1
            scoreMap[username].total += up - down;
        });
        
        // Convert to array and sort
        const scores = Object.values(scoreMap).sort((a, b) => b.total - a.total);
        
        displayScoreboard(scores);
        
    } catch (error) {
        console.error('Error loading scoreboard:', error);
        elements.scoreboardContent.innerHTML = '<p class="error-message">Failed to load scores</p>';
    }
}

function displayScoreboard(scores) {
    if (scores.length === 0) {
        elements.scoreboardContent.innerHTML = '<p class="loading">No votes yet. Be the first to vote!</p>';
        return;
    }
    
    elements.scoreboardContent.innerHTML = '';
    
    scores.forEach((score, index) => {
        const item = document.createElement('div');
        item.className = 'score-item';
        
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        const isCurrentUser = score.username === state.currentUser.getUsername();
        
        item.innerHTML = `
            <div class="score-rank ${rankClass}">${rank}</div>
            <div class="score-user">${escapeHtml(score.username)}${isCurrentUser ? ' (You)' : ''}</div>
            <div class="score-votes">
                <span>👍 ${score.up}</span>
                <span>👊 ${score.middle}</span>
                <span>👎 ${score.down}</span>
            </div>
            <div class="score-total">${score.total > 0 ? '+' : ''}${score.total}</div>
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
