package main

import (
	"log"
	"net/http"
	"os"

	"chat-app/handlers"
	"chat-app/room"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	manager := room.NewManager()

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	roomHandler := handlers.NewRoomHandler(manager, baseURL)
	wsHandler := handlers.NewWSHandler(manager)
	streamHandler := handlers.NewStreamHandler(manager)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// Load HTML templates
	r.LoadHTMLGlob("../frontend/*.html")

	// API routes
	api := r.Group("/api")
	{
		api.POST("/room", roomHandler.CreateRoom)
		api.POST("/room/:roomId/invite", roomHandler.AddInvite)
		api.GET("/qr/:token", roomHandler.GetQRCode)
	}

	// WebSocket - token based (single-use)
	r.GET("/ws/:token", wsHandler.HandleWebSocket)

	// WebSocket for stream (read-only, uses roomId)
	r.GET("/ws-stream/:roomId", streamHandler.HandleStreamWebSocket)

	// Chat page - validates token before serving
	r.GET("/c/:token", func(c *gin.Context) {
		token := c.Param("token")
		userIP := c.ClientIP()

		rm, valid := manager.CheckInvite(token, userIP)
		if !valid || rm == nil {
			c.String(http.StatusForbidden, "This invite link has already been used")
			return
		}
		c.HTML(http.StatusOK, "chat.html", gin.H{"token": token})
	})

	// Stream page - uses roomID directly (admin only)
	r.GET("/s/:roomId", func(c *gin.Context) {
		roomId := c.Param("roomId")
		rm := manager.GetRoom(roomId)
		if rm == nil {
			c.String(http.StatusNotFound, "Room not found")
			return
		}
		c.HTML(http.StatusOK, "stream.html", gin.H{"roomId": roomId})
	})

	// Admin page
	r.StaticFile("/", "../frontend/index.html")
	r.Static("/css", "../frontend/css")
	r.Static("/js", "../frontend/js")

	log.Printf("Server starting on port %s", port)
	log.Printf("Admin page: %s", baseURL)

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
