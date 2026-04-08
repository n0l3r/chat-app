package room

import (
	"crypto/rand"
	"encoding/base64"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn
	Name string
}

type Room struct {
	ID      string
	Clients map[*Client]bool
	mu      sync.RWMutex
}

type Invite struct {
	Token  string
	RoomID string
	Used   bool
	UserIP string // track who claimed it
}

type Manager struct {
	rooms   map[string]*Room  // roomID -> Room
	invites map[string]*Invite // token -> Invite
	mu      sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		rooms:   make(map[string]*Room),
		invites: make(map[string]*Invite),
	}
}

func (m *Manager) CreateRoom(id string) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	room := &Room{
		ID:      id,
		Clients: make(map[*Client]bool),
	}
	m.rooms[id] = room
	return room
}

func (m *Manager) GetRoom(id string) *Room {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.rooms[id]
}

// CreateInvite generates a single-use invite token for a room
func (m *Manager) CreateInvite(roomID string) *Invite {
	m.mu.Lock()
	defer m.mu.Unlock()

	token := generateToken()
	invite := &Invite{
		Token:  token,
		RoomID: roomID,
		Used:   false,
	}
	m.invites[token] = invite
	return invite
}

// GetInvite returns invite if valid (exists and not used)
func (m *Manager) GetInvite(token string) *Invite {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.invites[token]
}

// ClaimInvite marks invite as used, returns room if successful
func (m *Manager) ClaimInvite(token string, userIP string) (*Room, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	invite, exists := m.invites[token]
	if !exists {
		return nil, false
	}

	// Already used by someone else
	if invite.Used && invite.UserIP != userIP {
		return nil, false
	}

	// Claim it
	invite.Used = true
	invite.UserIP = userIP

	return m.rooms[invite.RoomID], true
}

// CheckInvite checks if token is valid without claiming
func (m *Manager) CheckInvite(token string, userIP string) (*Room, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	invite, exists := m.invites[token]
	if !exists {
		return nil, false
	}

	// Not used yet, or used by same IP
	if !invite.Used || invite.UserIP == userIP {
		return m.rooms[invite.RoomID], true
	}

	return nil, false
}

func generateToken() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)[:22]
}

func (r *Room) AddClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.Clients[client] = true
}

func (r *Room) RemoveClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.Clients, client)
}

func (r *Room) Broadcast(message []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for client := range r.Clients {
		client.Conn.WriteMessage(websocket.TextMessage, message)
	}
}

func (r *Room) ClientCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.Clients)
}
