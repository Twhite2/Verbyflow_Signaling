const logger = require('./logger');

// Store active sessions
const activeSessions = new Map();
const userConnections = new Map();

/**
 * Sets up Socket.IO event handlers
 * @param {Object} io - Socket.IO server instance
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`New connection: ${socket.id}`);

    // Store socket in userConnections when a user registers
    socket.on('register_user', (data, callback) => {
      try {
        const { userId } = data;
        
        if (!userId) {
          return callback({ success: false, error: 'User ID is required' });
        }

        // Add user to connections map
        userConnections.set(userId, socket.id);
        socket.userId = userId;

        logger.info(`User registered: ${userId} (Socket ID: ${socket.id})`);
        callback({ success: true });
      } catch (error) {
        logger.error(`Error in register_user: ${error.message}`);
        callback({ success: false, error: error.message });
      }
    });

    // Create a new meeting session
    socket.on('create_meeting', (data, callback) => {
      try {
        const { meetingId, user } = data;
        
        if (!meetingId || !user || !user.id) {
          return callback({ success: false, error: 'Invalid request data' });
        }

        // Check if the meeting ID is already in use
        if (activeSessions.has(meetingId)) {
          return callback({ success: false, error: 'Meeting ID already exists' });
        }

        // Create new session
        const session = {
          id: meetingId,
          host: user.id,
          participants: [user.id],
          status: 'waiting',
          sourceLanguage: user.preferredLanguage,
          createdAt: Date.now()
        };

        // Store session
        activeSessions.set(meetingId, session);
        
        // Join socket to room
        socket.join(meetingId);
        
        logger.info(`Meeting created: ${meetingId} by user ${user.id}`);
        callback({ success: true, isHost: true });
      } catch (error) {
        logger.error(`Error in create_meeting: ${error.message}`);
        callback({ success: false, error: error.message });
      }
    });

    // Join an existing meeting
    socket.on('join_meeting', (data, callback) => {
      try {
        const { meetingId, user } = data;
        
        if (!meetingId || !user || !user.id) {
          return callback({ success: false, error: 'Invalid request data' });
        }

        // Check if the meeting exists
        if (!activeSessions.has(meetingId)) {
          return callback({ success: false, error: 'Meeting not found' });
        }

        const session = activeSessions.get(meetingId);

        // Add user to session
        if (!session.participants.includes(user.id)) {
          session.participants.push(user.id);
        }
        
        session.targetLanguage = user.preferredLanguage;
        session.status = 'connecting';

        // Update session
        activeSessions.set(meetingId, session);
        
        // Join socket to room
        socket.join(meetingId);
        
        logger.info(`User ${user.id} joined meeting: ${meetingId}`);

        // Notify the host
        const hostSocketId = userConnections.get(session.host);
        if (hostSocketId) {
          socket.to(hostSocketId).emit('participant_joined', { 
            meetingId, 
            userId: user.id,
            preferredLanguage: user.preferredLanguage
          });
        }
        
        callback({ 
          success: true, 
          isHost: false,
          hostId: session.host,
          sourceLanguage: session.sourceLanguage
        });
      } catch (error) {
        logger.error(`Error in join_meeting: ${error.message}`);
        callback({ success: false, error: error.message });
      }
    });

    // Handle WebRTC signaling (SDP offer)
    socket.on('webrtc_offer', (data) => {
      try {
        const { meetingId, toUserId, offer } = data;

        if (!meetingId || !toUserId || !offer) {
          logger.error('Invalid webrtc_offer data');
          return;
        }

        // Verify meeting exists
        if (!activeSessions.has(meetingId)) {
          logger.error(`Meeting ${meetingId} not found for webrtc_offer`);
          return;
        }

        // Find receiver's socket
        const receiverSocketId = userConnections.get(toUserId);
        if (!receiverSocketId) {
          logger.error(`Receiver ${toUserId} not found for webrtc_offer`);
          return;
        }

        // Forward the offer to the receiver
        io.to(receiverSocketId).emit('webrtc_offer', {
          meetingId,
          fromUserId: socket.userId,
          offer
        });

        logger.info(`WebRTC offer sent to ${toUserId} in meeting ${meetingId}`);
      } catch (error) {
        logger.error(`Error in webrtc_offer: ${error.message}`);
      }
    });

    // Handle WebRTC signaling (SDP answer)
    socket.on('webrtc_answer', (data) => {
      try {
        const { meetingId, toUserId, answer } = data;

        if (!meetingId || !toUserId || !answer) {
          logger.error('Invalid webrtc_answer data');
          return;
        }

        // Verify meeting exists
        if (!activeSessions.has(meetingId)) {
          logger.error(`Meeting ${meetingId} not found for webrtc_answer`);
          return;
        }

        // Find receiver's socket
        const receiverSocketId = userConnections.get(toUserId);
        if (!receiverSocketId) {
          logger.error(`Receiver ${toUserId} not found for webrtc_answer`);
          return;
        }

        // Forward the answer to the receiver
        io.to(receiverSocketId).emit('webrtc_answer', {
          meetingId,
          fromUserId: socket.userId,
          answer
        });

        // Update session status
        const session = activeSessions.get(meetingId);
        session.status = 'connected';
        activeSessions.set(meetingId, session);

        logger.info(`WebRTC answer sent to ${toUserId} in meeting ${meetingId}`);
      } catch (error) {
        logger.error(`Error in webrtc_answer: ${error.message}`);
      }
    });

    // Handle ICE candidates
    socket.on('ice_candidate', (data) => {
      try {
        const { meetingId, toUserId, candidate } = data;

        if (!meetingId || !toUserId || !candidate) {
          logger.error('Invalid ice_candidate data');
          return;
        }

        // Find receiver's socket
        const receiverSocketId = userConnections.get(toUserId);
        if (!receiverSocketId) {
          logger.error(`Receiver ${toUserId} not found for ice_candidate`);
          return;
        }

        // Forward the ICE candidate to the receiver
        io.to(receiverSocketId).emit('ice_candidate', {
          meetingId,
          fromUserId: socket.userId,
          candidate
        });

        logger.debug(`ICE candidate sent to ${toUserId} in meeting ${meetingId}`);
      } catch (error) {
        logger.error(`Error in ice_candidate: ${error.message}`);
      }
    });

    // End meeting or leave meeting
    socket.on('end_meeting', (data, callback) => {
      try {
        const { meetingId } = data;
        
        if (!meetingId) {
          return callback({ success: false, error: 'Meeting ID is required' });
        }

        // Check if meeting exists
        if (!activeSessions.has(meetingId)) {
          return callback({ success: false, error: 'Meeting not found' });
        }

        const session = activeSessions.get(meetingId);

        // Check if user is the host
        const isHost = session.host === socket.userId;

        if (isHost) {
          // End the entire meeting if host leaves
          io.to(meetingId).emit('meeting_ended', {
            meetingId,
            reason: 'Host ended the meeting'
          });

          // Remove meeting
          activeSessions.delete(meetingId);
          logger.info(`Meeting ${meetingId} ended by host ${socket.userId}`);
        } else {
          // Just remove this participant
          const updatedParticipants = session.participants.filter(
            participantId => participantId !== socket.userId
          );
          
          session.participants = updatedParticipants;
          activeSessions.set(meetingId, session);

          // Notify host that participant left
          const hostSocketId = userConnections.get(session.host);
          if (hostSocketId) {
            io.to(hostSocketId).emit('participant_left', {
              meetingId,
              userId: socket.userId
            });
          }
          
          // Leave the room
          socket.leave(meetingId);
          logger.info(`User ${socket.userId} left meeting ${meetingId}`);
        }
        
        callback({ success: true });
      } catch (error) {
        logger.error(`Error in end_meeting: ${error.message}`);
        callback({ success: false, error: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      try {
        const userId = socket.userId;
        
        if (userId) {
          logger.info(`User disconnected: ${userId}`);
          userConnections.delete(userId);

          // Check if user is in any active sessions
          for (const [meetingId, session] of activeSessions.entries()) {
            if (session.participants.includes(userId)) {
              // If host disconnected, end the meeting
              if (session.host === userId) {
                io.to(meetingId).emit('meeting_ended', {
                  meetingId,
                  reason: 'Host disconnected'
                });
                activeSessions.delete(meetingId);
                logger.info(`Meeting ${meetingId} ended due to host disconnect`);
              } else {
                // If participant disconnected, remove from session
                const updatedParticipants = session.participants.filter(
                  participantId => participantId !== userId
                );
                session.participants = updatedParticipants;
                activeSessions.set(meetingId, session);

                // Notify host
                const hostSocketId = userConnections.get(session.host);
                if (hostSocketId) {
                  io.to(hostSocketId).emit('participant_left', {
                    meetingId,
                    userId
                  });
                }
                
                logger.info(`User ${userId} removed from meeting ${meetingId} due to disconnect`);
              }
            }
          }
        } else {
          logger.info(`Socket disconnected: ${socket.id}`);
        }
      } catch (error) {
        logger.error(`Error handling disconnect: ${error.message}`);
      }
    });
  });
}

module.exports = { setupSocketHandlers };
