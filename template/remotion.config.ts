import {Config} from '@remotion/cli/config';

// 1-CPU sandbox convention: sequential rendering, never parallel workers.
Config.setConcurrency(1);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
