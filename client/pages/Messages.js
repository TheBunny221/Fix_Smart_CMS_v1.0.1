import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { MessageSquare, Send, Search, Users, Clock, CheckCheck, Plus, } from "lucide-react";
const Messages = () => {
    const [selectedChat, setSelectedChat] = useState("1");
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const conversations = [
        {
            id: "1",
            name: "Maintenance Team Alpha",
            lastMessage: "Water pipeline repair completed",
            timestamp: "10:30 AM",
            unread: 2,
            online: true,
            type: "group",
        },
        {
            id: "2",
            name: "Ward Officer - Central",
            lastMessage: "Please assign the electrical issue to...",
            timestamp: "9:45 AM",
            unread: 0,
            online: true,
            type: "individual",
        },
        {
            id: "3",
            name: "Emergency Response Team",
            lastMessage: "Road blockage cleared",
            timestamp: "Yesterday",
            unread: 0,
            online: false,
            type: "group",
        },
        {
            id: "4",
            name: "Sanitation Team B",
            lastMessage: "Schedule updated for tomorrow",
            timestamp: "Yesterday",
            unread: 1,
            online: true,
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
                isOwn: false,
                type: "text",
            },
            {
                id: "2",
                sender: "You",
                content: "Great work! Please send the completion photos",
                timestamp: "10:32 AM",
                isOwn: true,
                type: "text",
            },
            {
                id: "3",
                sender: "John Doe",
                content: "Photos uploaded to the complaint record",
                timestamp: "10:35 AM",
                isOwn: false,
                type: "text",
            },
        ],
        "2": [
            {
                id: "1",
                sender: "Sarah Wilson",
                content: "Please assign the electrical issue at Broadway to the electrical team",
                timestamp: "9:45 AM",
                isOwn: false,
                type: "text",
            },
        ],
    };
    const filteredConversations = conversations.filter((conv) => conv.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedMessages = selectedChat
        ? messages[selectedChat] || []
        : [];
    const handleSendMessage = () => {
        if (newMessage.trim() && selectedChat) {
            // Add message logic here
            setNewMessage("");
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Team Communication" }), _jsx("p", { className: "text-gray-600", children: "Internal messaging and coordination" })] }), _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "New Message"] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 h-96", children: [_jsxs(Card, { className: "lg:col-span-1", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(MessageSquare, { className: "h-5 w-5 mr-2" }), "Conversations"] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search conversations...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] })] }), _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "space-y-1", children: filteredConversations.map((conversation) => (_jsx("div", { onClick: () => setSelectedChat(conversation.id), className: `p-3 cursor-pointer border-l-4 transition-colors ${selectedChat === conversation.id
                                            ? "bg-blue-50 border-blue-500"
                                            : "hover:bg-gray-50 border-transparent"}`, children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Avatar, { className: "h-10 w-10", children: _jsx(AvatarFallback, { children: conversation.type === "group" ? (_jsx(Users, { className: "h-5 w-5" })) : (conversation.name.charAt(0)) }) }), conversation.online && (_jsx("div", { className: "absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" }))] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: conversation.name }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-xs text-gray-500", children: conversation.timestamp }), conversation.unread > 0 && (_jsx(Badge, { className: "bg-blue-600 text-white h-5 w-5 p-0 flex items-center justify-center text-xs", children: conversation.unread }))] })] }), _jsx("p", { className: "text-sm text-gray-500 truncate mt-1", children: conversation.lastMessage })] })] }) }, conversation.id))) }) })] }), _jsx(Card, { className: "lg:col-span-2 flex flex-col", children: selectedChat ? (_jsxs(_Fragment, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Avatar, { children: _jsx(AvatarFallback, { children: _jsx(Users, { className: "h-5 w-5" }) }) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: conversations.find((c) => c.id === selectedChat)?.name }), _jsx("p", { className: "text-sm text-gray-500", children: conversations.find((c) => c.id === selectedChat)?.online
                                                            ? "Online"
                                                            : "Offline" })] })] }) }), _jsx(CardContent, { className: "flex-1 overflow-y-auto space-y-4", children: selectedMessages.map((message) => (_jsx("div", { className: `flex ${message.isOwn ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isOwn
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-900"}`, children: [!message.isOwn && (_jsx("p", { className: "text-xs font-medium mb-1 opacity-70", children: message.sender })), _jsx("p", { className: "text-sm", children: message.content }), _jsxs("div", { className: "flex items-center justify-end mt-1 space-x-1", children: [_jsx("span", { className: "text-xs opacity-70", children: message.timestamp }), message.isOwn && (_jsx(CheckCheck, { className: "h-3 w-3 opacity-70" }))] })] }) }, message.id))) }), _jsx("div", { className: "p-4 border-t", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Textarea, { value: newMessage, onChange: (e) => setNewMessage(e.target.value), placeholder: "Type your message...", className: "flex-1 min-h-[60px] resize-none", onKeyPress: (e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                } }), _jsx(Button, { onClick: handleSendMessage, disabled: !newMessage.trim(), className: "self-end", children: _jsx(Send, { className: "h-4 w-4" }) })] }) })] })) : (_jsx(CardContent, { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(MessageSquare, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "Select a conversation to start messaging" })] }) })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Chats" }), _jsx("p", { className: "text-2xl font-bold", children: "8" })] }), _jsx(MessageSquare, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Team Members" }), _jsx("p", { className: "text-2xl font-bold", children: "24" })] }), _jsx(Users, { className: "h-8 w-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Avg Response" }), _jsx("p", { className: "text-2xl font-bold", children: "12m" })] }), _jsx(Clock, { className: "h-8 w-8 text-orange-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Today's Messages" }), _jsx("p", { className: "text-2xl font-bold", children: "156" })] }), _jsx(MessageSquare, { className: "h-8 w-8 text-purple-600" })] }) }) })] })] }));
};
export default Messages;
