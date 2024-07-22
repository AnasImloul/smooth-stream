import { WholeStreamingStrategy } from "./whole-strategy";
import { CharacterStreamingStrategy } from "./character-strategy";
import { WordStreamingStrategy } from "./word-strategy";


enum StreamingMode {
  CHARACTER,
  WORD,
  WHOLE,
}

function getStreamingStrategy(streamingMode: StreamingMode) {
  switch (streamingMode) {
    case StreamingMode.CHARACTER:
      return new CharacterStreamingStrategy();
    case StreamingMode.WORD:
      return new WordStreamingStrategy();
    case StreamingMode.WHOLE:
      return new WholeStreamingStrategy();
  }
}

export {
  CharacterStreamingStrategy,
  WordStreamingStrategy,
  WholeStreamingStrategy,
  getStreamingStrategy,
  StreamingMode,
}