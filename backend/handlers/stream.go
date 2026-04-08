package handlers

import (
	"log"

	"chat-app/room"

	"github.com/gin-gonic/gin"
)

type StreamHandler struct {
	Manager *room.Manager
}

func NewStreamHandler(manager *room.Manager) *StreamHandler {
	return &StreamHandler{Manager: manager}
}

func (h *StreamHandler) HandleStreamWebSocket(c *gin.Context) {
	roomID := c.Param("roomId")

	r := h.Manager.GetRoom(roomID)
	if r == nil {
		c.JSON(404, gin.H{"error": "room not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Stream viewer is read-only, just receives broadcasts
	client := &room.Client{
		Conn: conn,
		Name: "__stream__",
	}

	r.AddClient(client)

	defer func() {
		r.RemoveClient(client)
		conn.Close()
	}()

	// Keep connection alive, ignore any incoming messages
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
