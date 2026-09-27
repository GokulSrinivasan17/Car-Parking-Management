import React, { useState, useRef } from 'react';
import './ParkSmartAI.css';
import AITrigger from './AITrigger';
import AIChatWindow from './AIChatWindow';
import api from '../../utils/api';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'assistant',
    text: "Hi! I'm ParkSmart AI.\n\nI can help you book a parking slot or answer questions about ParkSmart.",
    timestamp: Date.now()
  }
];

/**
 * ParkSmartAI Component (Phase 2 - Google Gemini Backend Connected)
 * Provides the floating 4-point sparkle AI trigger, expandable assistant chat window,
 * and seamless integration with the ParkSmart Express + Gemini backend.
 */
const ParkSmartAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingContext, setBookingContext] = useState(null);
  const inputRef = useRef(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelectQuickAction = (text) => {
    setInputValue(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    // Append user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Prepare bounded conversation history (exclude initial static welcome & error messages)
    const history = messages
      .filter((m) => m.id !== 'welcome-1' && !m.isError)
      .slice(-10)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    try {
      const { data } = await api.post('/ai/chat', {
        message: trimmed,
        history,
        bookingContext
      });

      if (data && data.success && data.message) {
        const assistantMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.message,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Retain booking intent state across turns
        if (data.bookingIntent && (data.bookingIntent.intent === 'booking' || data.bookingIntent.intent === 'booking_pending_confirmation')) {
          setBookingContext(data.bookingIntent);
        } else if (data.bookingIntent && ['booking_confirmed', 'booking_cancelled'].includes(data.bookingIntent.intent)) {
          setBookingContext(null);
        }
      } else {
        const fallbackMsg = data?.message || "Sorry, I'm having trouble connecting right now. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: fallbackMsg,
            isError: true,
            timestamp: Date.now()
          }
        ]);
      }
    } catch (err) {
      let errorMessage = "Sorry, I'm having trouble connecting right now. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: errorMessage,
          isError: true,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AITrigger onClick={handleOpen} isOpen={isOpen} />
      <AIChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onSelectQuickAction={handleSelectQuickAction}
        inputRef={inputRef}
        isLoading={isLoading}
      />
    </>
  );
};

export default ParkSmartAI;
