import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  MessageSquare,
  Send,
  Search,
  Users,
  Clock,
  CheckCheck,
  Plus,
} from "lucide-react";

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState("1");
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const conversations = [
    {
      id: "1",
      name: "Maintenance Team Alpha",
      lastMessage: "Water pipeline repair completed",
      timestamp: "10:30 AM",
      unread,
      online,
      type: "group",
    },
    {
      id: "2",
      name: "Ward Officer - Central",
      lastMessage: "Please assign the electrical issue to...",
      timestamp: "9:45 AM",
      unread,
      online,
      type: "individual",
    },
    {
      id: "3",
      name: "Emergency Response Team",
      lastMessage: "Road blockage cleared",
      timestamp: "Yesterday",
      unread,
      online,
      type: "group",
    },
    {
      id: "4",
      name: "Sanitation Team B",
      lastMessage: "Schedule updated for tomorrow",
      timestamp: "Yesterday",
      unread,
      online,
      type: "group",
    },
  ];

  const messages = {
    "1": [
      {
        id: "1",
        sender: "John Doe",
        content: "Water pipeline repair at MG Road has been completed",
        timestamp: "10:30 AM",
        isOwn,
        type: "text",
      },
      {
        id: "2",
        sender: "You",
        content: "Great work Please send the completion photos",
        timestamp: "10:32 AM",
        isOwn,
        type: "text",
      },
      {
        id: "3",
        sender: "John Doe",
        content: "Photos uploaded to the complaint record",
        timestamp: "10:35 AM",
        isOwn,
        type: "text",
      },
    ],
    "2": [
      {
        id: "1",
        sender: "Sarah Wilson",
        content:
          "Please assign the electrical issue at Broadway to the electrical team",
        timestamp: "9:45 AM",
        isOwn,
        type: "text",
      },
    ],
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedMessages = selectedChat
    ? messages[selectedChat typeof messages] || []
    : [];

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      // Add message logic here
      setNewMessage("");
    }
  };

  return (
    
      {/* Header */}
      
        
          
            Team Communication
          
          Internal messaging and coordination
        
        
          
          New Message
        
      

      {/* Main Chat Interface */}
      
        {/* Conversations List */}
        
          
            
              
              Conversations
            
            
              
               setSearchTerm(e.target.value)}
                className="pl-10"
              />
            
          
          
            
              {filteredConversations.map((conversation) => (
                 setSelectedChat(conversation.id)}
                  className={`p-3 cursor-pointer border-l-4 transition-colors ${
                    selectedChat === conversation.id
                      ? "bg-blue-50 border-blue-500"
                      : "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  
                    
                      
                        
                          {conversation.type === "group" ? (
                            
                          ) : (
                            conversation.name.charAt(0)
                          )}
                        
                      
                      {conversation.online && (
                        
                      )}
                    
                    
                      
                        
                          {conversation.name}
                        
                        
                          
                            {conversation.timestamp}
                          
                          {conversation.unread > 0 && (
                            
                              {conversation.unread}
                            
                          )}
                        
                      
                      
                        {conversation.lastMessage}
                      
                    
                  
                
              ))}
            
          
        

        {/* Chat Area */}
        
          {selectedChat ? (
            
              {/* Chat Header */}
              
                
                  
                    
                      
                    
                  
                  
                    
                      {conversations.find((c) => c.id === selectedChat)?.name}
                    
                    
                      {conversations.find((c) => c.id === selectedChat)?.online
                        ? "Online"
                        : "Offline"}
                    
                  
                
              

              {/* Messages */}
              
                {selectedMessages.map((message) => (
                  
                    
                      {message.isOwn && (
                        
                          {message.sender}
                        
                      )}
                      {message.content}
                      
                        
                          {message.timestamp}
                        
                        {message.isOwn && (
                          
                        )}
                      
                    
                  
                ))}
              

              {/* Message Input */}
              
                
                   setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  
                    
                  
                
              
            
          ) : (
            
              
                
                
                  Select a conversation to start messaging
                
              
            
          )}
        
      

      {/* Communication Stats */}
      
        
          
            
              
                
                  Active Chats
                
                8
              
              
            
          
        
        
          
            
              
                
                  Team Members
                
                24
              
              
            
          
        
        
          
            
              
                
                  Avg Response
                
                12m
              
              
            
          
        
        
          
            
              
                
                  Today's Messages
                
                156
              
              
            
          
        
      
    
  );
};

export default Messages;
