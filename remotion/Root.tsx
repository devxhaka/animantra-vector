import React from 'react';
import { Composition } from 'remotion';
import { VideoUtama, totalFrame, type PropsVideo } from './Video';
import { SPEC_CONTOH } from '../shared/contoh-spec';

export const Root: React.FC = () => (
  <Composition
    id="Video"
    component={VideoUtama}
    defaultProps={{ spec: SPEC_CONTOH, basis: '' } satisfies PropsVideo}
    durationInFrames={totalFrame(SPEC_CONTOH)}
    fps={30}
    width={1080}
    height={1920}
    calculateMetadata={({ props }) => ({
      durationInFrames: totalFrame(props.spec),
      fps: props.spec.fps,
      width: props.spec.lebar,
      height: props.spec.tinggi,
    })}
  />
);
