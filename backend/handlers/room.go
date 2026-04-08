package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"

	"chat-app/room"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
)

type RoomHandler struct {
	Manager *room.Manager
	BaseURL string
}

func NewRoomHandler(manager *room.Manager, baseURL string) *RoomHandler {
	return &RoomHandler{
		Manager: manager,
		BaseURL: baseURL,
	}
}

type CreateRoomResponse struct {
	RoomID    string `json:"room_id"`
	Token     string `json:"token"`
	ChatURL   string `json:"chat_url"`
	StreamURL string `json:"stream_url"`
	QRUrl     string `json:"qr_url"`
}

func (h *RoomHandler) CreateRoom(c *gin.Context) {
	roomID := generateRoomID()
	h.Manager.CreateRoom(roomID)

	// Create first invite
	invite := h.Manager.CreateInvite(roomID)

	response := CreateRoomResponse{
		RoomID:    roomID,
		Token:     invite.Token,
		ChatURL:   fmt.Sprintf("%s/c/%s", h.BaseURL, invite.Token),
		StreamURL: fmt.Sprintf("%s/s/%s", h.BaseURL, roomID),
		QRUrl:     fmt.Sprintf("/api/qr/%s", invite.Token),
	}

	c.JSON(http.StatusCreated, response)
}

type AddInviteResponse struct {
	Token   string `json:"token"`
	ChatURL string `json:"chat_url"`
	QRUrl   string `json:"qr_url"`
}

// AddInvite creates a new single-use invite for existing room
func (h *RoomHandler) AddInvite(c *gin.Context) {
	roomID := c.Param("roomId")

	r := h.Manager.GetRoom(roomID)
	if r == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	invite := h.Manager.CreateInvite(roomID)

	response := AddInviteResponse{
		Token:   invite.Token,
		ChatURL: fmt.Sprintf("%s/c/%s", h.BaseURL, invite.Token),
		QRUrl:   fmt.Sprintf("/api/qr/%s", invite.Token),
	}

	c.JSON(http.StatusCreated, response)
}

func (h *RoomHandler) GetQRCode(c *gin.Context) {
	token := c.Param("token")

	invite := h.Manager.GetInvite(token)
	if invite == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid token"})
		return
	}

	chatURL := fmt.Sprintf("%s/c/%s", h.BaseURL, token)

	png, err := qrcode.Encode(chatURL, qrcode.Medium, 256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR"})
		return
	}

	c.Data(http.StatusOK, "image/png", png)
}

func generateRoomID() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
