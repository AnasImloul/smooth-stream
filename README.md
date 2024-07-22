# Smooth Stream

A library for streaming text responses smoothly with different strategies.

## Installation

```bash
npm install smooth-stream
```

## Usage
The Smooth Stream library allows you to stream text content in a smooth, controlled manner. It supports different streaming strategies to cater to various needs. Below are examples in both JavaScript and TypeScript to demonstrate how to use the library.

### JavaScript

#### Importing and initializing the smooth stream

```js
const { 
    SmoothStreamer,
    StreamingMode,
    getStreamingStrategy 
} = require('smooth-stream');

// Create a SmoothStream instance with a 100ms delay
// between characters
// and prefix matching enabled
const streamer = new SmoothStreamer(
    100, // 100ms delay between updates
    getStreamingStrategy(StreamingMode.CHARACTER),
    true // prefix matching
);
```

#### Subscribe to the stream events

```js
// Subscribe to the streamer to handle 
// responses, errors, and completion
streamer.subscribe(
    // callback for any new response
    (response) => console.log(response),
    // callback for any error
    (err) => console.error(err),
    // callback for the end of the stream
    () => console.log("Stream ended")
);

// Add a callback for when the entire stream ends
// This executes after streamer.subscribe completes
streamer.onStreamEnd(() => {
    console.log('Streaming ended.');
});
```

#### Stream Text
```js
// Start streaming text character by character
streamer.next('Hello'); // Stream "Hello"

// Continue streaming the extended text
streamer.next('Hello, this is a test response.', () => {
    // This code runs after the text from this call is fully streamed
    // and runs before any next stream calls
    console.log("text has been fully streamed.")
    
    // Flush the stream to reset it and clear pending updates
    streamer.flush();

    // Add new text to the stream after flushing
    streamer.next('New stream started.');
});

streamer.next('This will not be streamed because it got flushed');

```
### TypeScript

The Smooth Stream library has native support for TypeScript, allowing you to take advantage of type checking and autocompletion benefits in TypeScript projects. The usage in TypeScript is identical to the JavaScript example above, with the addition of type annotations.

## Streaming Strategies
The library supports three streaming strategies, each suited for different types of text streaming needs:

- **Character**: Streams the response one character at a time, providing a smooth, letter-by-letter reveal of the text.
- **Word**: Streams the response one word at a time, skipping HTML tags and ensuring a natural word-by-word display.
- **Whole**: Streams the entire response at once, delivering the full text immediately without gradual reveal.

## What is Prefix Matching?
Prefix match means that when two consecutive next() calls are made, the stream will reset to the longest common prefix of the two strings. For example:

```js
streamer.next('Hello, world');
streamer.next('Hello, everyone');
```

In this case, after the second call to `next()`, the stream will reset to "Hello, " which is the longest common prefix of "Hello, world" and "Hello, everyone". The streaming will then continue from "Hello, " to "Hello, everyone".

By choosing the appropriate streaming strategy and utilizing the prefix match feature, you can tailor the text streaming behavior to match the desired user experience.
