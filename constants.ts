
import { Step } from './types';

export const BREADCRUMB_STEPS = [
  "Project",
  "Idea",
  "Screenplay",
  "Characters",
  "Shotlist",
  "Storyboard",
  "Export"
];

export const GENRES = [
  "Action", "Animation", "Comedy", "Commercial", "Documentary", "Drama", 
  "Educational", "Fantasy", "Horror", "Music Video", "Mystery", "Romance", 
  "Science Fiction", "Thriller"
];

export const ART_STYLES = [
    "3D Pixar/Disney style",
    "Anime style",
    "Semi-realistic",
    "Cute Cartoon"
];

export const MAX_CHARACTERS_OPTIONS = [1, 2, 3, 4, 5];
export const MAX_SCENES_OPTIONS = [4, 6, 8, 10, 12];

export const INITIAL_PROJECT_STATE = {
  title: "",
  genre: GENRES[0],
  maxCharacters: 2,
  maxScenes: 8,
  storyConcept: "",
  screenplay: [],
  characters: [],
  shotlist: [],
  storyboard: [],
  styleGuide: "cinematic, hyper-realistic, high detail, 4k",
  artStyle: ART_STYLES[0],
};