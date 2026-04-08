package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"chat-app/room"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type WSHandler struct {
	Manager *room.Manager
}

func NewWSHandler(manager *room.Manager) *WSHandler {
	return &WSHandler{Manager: manager}
}

type Message struct {
	Type      string `json:"type"`
	Name      string `json:"name"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
}

func (h *WSHandler) HandleWebSocket(c *gin.Context) {
	token := c.Param("token")
	userName := c.Query("name")
	userIP := c.ClientIP()

	if userName == "" {
		userName = "Anonymous"
	}

	// Claim the invite (single-use)
	r, ok := h.Manager.ClaimInvite(token, userIP)
	if !ok || r == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "invite already used or invalid"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &room.Client{
		Conn: conn,
		Name: userName,
	}

	r.AddClient(client)

	joinMsg := Message{
		Type:      "system",
		Name:      userName,
		Content:   userName + " joined the chat",
		Timestamp: time.Now().Format("15:04"),
	}
	broadcastMessage(r, joinMsg)

	defer func() {
		r.RemoveClient(client)
		conn.Close()

		leaveMsg := Message{
			Type:      "system",
			Name:      userName,
			Content:   userName + " left the chat",
			Timestamp: time.Now().Format("15:04"),
		}
		broadcastMessage(r, leaveMsg)
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var incoming struct {
			Content string `json:"content"`
		}
		if err := json.Unmarshal(msgBytes, &incoming); err != nil {
			continue
		}

		if incoming.Content == "" {
			continue
		}

		chatMsg := Message{
			Type:      "chat",
			Name:      userName,
			Content:   incoming.Content,
			Timestamp: time.Now().Format("15:04"),
		}
		broadcastMessage(r, chatMsg)
	}
}

func broadcastMessage(r *room.Room, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	r.Broadcast(data)
}
