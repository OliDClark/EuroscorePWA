// Parse configuration - Users need to update these with their Parse server details
const PARSE_CONFIG = {
    appId: 'YOUR_APP_ID',
    javascriptKey: 'YOUR_JAVASCRIPT_KEY',
    serverURL: 'YOUR_SERVER_URL' // e.g., 'https://parseapi.back4app.com'
};

// Initialize Parse
Parse.initialize(PARSE_CONFIG.appId, PARSE_CONFIG.javascriptKey);
Parse.serverURL = PARSE_CONFIG.serverURL;

// State management
const state = {
    currentUser: null,
    currentParty: null,
    userParties: [],
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
    
    partiesList: document.getElementById('parties-list'),
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
    refreshScoresBtn: document.getElementById('refresh-scores-btn')
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
    elements.partiesList.innerHTML = '<p class="loading">Loading parties...</p>';
    
    try {
        const PartyMember = Parse.Object.extend('PartyMember');
        const query = new Parse.Query(PartyMember);
        query.equalTo('user', state.currentUser);
        query.include('party');
        query.descending('createdAt');
        
        const memberships = await query.find();
        state.userParties = memberships.map(m => m.get('party')).filter(p => p);
        
        displayParties();
    } catch (error) {
        console.error('Error loading parties:', error);
        elements.partiesList.innerHTML = '<p class="error-message">Failed to load parties</p>';
    }
}

function displayParties() {
    if (state.userParties.length === 0) {
        elements.partiesList.innerHTML = '<p class="loading">No parties yet. Create or join one!</p>';
        return;
    }
    
    elements.partiesList.innerHTML = '';
    
    state.userParties.forEach(party => {
        const card = document.createElement('div');
        card.className = 'party-card';
        card.onclick = () => showPartyScreen(party);
        
        const name = party.get('name');
        const description = party.get('description') || 'No description';
        const code = party.get('code');
        const created = party.createdAt.toLocaleDateString();
        
        card.innerHTML = `
            <h4>${escapeHtml(name)}</h4>
            <p>${escapeHtml(description)}</p>
            <div class="party-meta">
                <span>Code: ${escapeHtml(code)}</span>
                <span>Created: ${created}</span>
            </div>
        `;
        
        elements.partiesList.appendChild(card);
    });
}

async function handleCreateParty() {
    const name = elements.partyNameInput.value.trim();
    const description = elements.partyDescriptionInput.value.trim();
    
    elements.createError.textContent = '';
    
    if (!name) {
        elements.createError.textContent = 'Please enter a party name';
        return;
    }
    
    elements.createPartyBtn.disabled = true;
    elements.createPartyBtn.textContent = 'Creating...';
    
    try {
        const Party = Parse.Object.extend('Party');
        const party = new Party();
        
        // Generate unique party code with verification
        const code = await generateUniquePartyCode();
        
        party.set('name', name);
        party.set('description', description);
        party.set('code', code);
        party.set('creator', state.currentUser);
        
        await party.save();
        
        // Add creator as member
        await joinPartyById(party);
        
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
    const code = elements.partyCodeInput.value.trim().toUpperCase();
    
    elements.joinError.textContent = '';
    
    if (!code) {
        elements.joinError.textContent = 'Please enter a party code';
        return;
    }
    
    elements.joinPartyBtn.disabled = true;
    elements.joinPartyBtn.textContent = 'Joining...';
    
    try {
        // Find party by code
        const Party = Parse.Object.extend('Party');
        const query = new Parse.Query(Party);
        query.equalTo('code', code);
        
        const party = await query.first();
        
        if (!party) {
            elements.joinError.textContent = 'Party not found';
            return;
        }
        
        // Check if already a member
        const PartyMember = Parse.Object.extend('PartyMember');
        const memberQuery = new Parse.Query(PartyMember);
        memberQuery.equalTo('user', state.currentUser);
        memberQuery.equalTo('party', party);
        
        const existing = await memberQuery.first();
        
        if (existing) {
            // Already a member, just show the party
            await loadUserParties();
            showPartyScreen(party);
            return;
        }
        
        // Add as member
        await joinPartyById(party);
        
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

async function joinPartyById(party) {
    const PartyMember = Parse.Object.extend('PartyMember');
    const member = new PartyMember();
    member.set('user', state.currentUser);
    member.set('party', party);
    await member.save();
}

// Party detail screen
async function updatePartyScreen() {
    const party = state.currentParty;
    
    elements.partyTitle.textContent = party.get('name');
    elements.partyDescription.textContent = party.get('description') || 'No description';
    elements.partyCodeDisplay.textContent = party.get('code');
    
    // Load current user's vote
    await loadUserVote();
    
    // Load scoreboard
    await loadScoreboard();
}

async function loadUserVote() {
    try {
        const Vote = Parse.Object.extend('Vote');
        const query = new Parse.Query(Vote);
        query.equalTo('user', state.currentUser);
        query.equalTo('party', state.currentParty);
        
        const vote = await query.first();
        
        // Update UI
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (vote) {
            state.currentUserVote = vote;
            const voteValue = vote.get('vote');
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
        const Vote = Parse.Object.extend('Vote');
        let vote;
        
        if (state.currentUserVote) {
            // Update existing vote
            vote = state.currentUserVote;
            vote.set('vote', voteValue);
        } else {
            // Create new vote
            vote = new Vote();
            vote.set('user', state.currentUser);
            vote.set('party', state.currentParty);
            vote.set('vote', voteValue);
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
        const Vote = Parse.Object.extend('Vote');
        const query = new Parse.Query(Vote);
        query.equalTo('party', state.currentParty);
        query.include('user');
        
        const votes = await query.find();
        
        // Calculate scores
        const scoreMap = {};
        
        votes.forEach(vote => {
            const user = vote.get('user');
            if (!user) return;
            
            const username = user.getUsername();
            const voteValue = vote.get('vote');
            
            if (!scoreMap[username]) {
                scoreMap[username] = {
                    username: username,
                    up: 0,
                    middle: 0,
                    down: 0,
                    total: 0
                };
            }
            
            scoreMap[username][voteValue]++;
            
            // Calculate total: up = +1, middle = 0, down = -1
            if (voteValue === 'up') scoreMap[username].total += 1;
            else if (voteValue === 'down') scoreMap[username].total -= 1;
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
    const Party = Parse.Object.extend('Party');
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
        code = generatePartyCode();
        
        // Check if code already exists
        const query = new Parse.Query(Party);
        query.equalTo('code', code);
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
