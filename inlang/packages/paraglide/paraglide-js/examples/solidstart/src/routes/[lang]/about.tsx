import { Title } from '@solidjs/meta';

import { m } from '~/paraglide/messages';
import { getLocale } from '~/paraglide/runtime';

const About = () => {
  return (
    <>
      <Title>About</Title>
      <h1>About</h1>
      <h2>Current locale: {getLocale()}</h2>
      <p>{m.example_message({ username: 'Bob' })}</p>
    </>
  );
};

export default About;