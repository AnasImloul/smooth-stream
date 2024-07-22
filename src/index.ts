import { StreamingStrategy } from "./types";
import {
  CharacterStreamingStrategy,
  WholeStreamingStrategy,
  WordStreamingStrategy,
  StreamingMode,
  getStreamingStrategy,
} from './strategies';
import { SmoothStreamer } from './streamer';


export {
  SmoothStreamer,
  StreamingStrategy,
  CharacterStreamingStrategy,
  WordStreamingStrategy,
  WholeStreamingStrategy,
  StreamingMode,
  getStreamingStrategy,
}