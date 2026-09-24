import React, { useEffect } from 'react';
import styled from 'styled-components';

// Minimal centered design matching live NotFoundRoute
// (_container_1299l_1 / _code_1299l_8 / _message_1299l_16 in production CSS)
const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`;

const Code = styled.div`
  font-size: clamp(8rem, 30vw, 20rem);
  font-weight: 900;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 2px var(--global-text);
  text-align: center;
`;

const Message = styled.div`
  font-size: clamp(2rem, 10vw, 5rem);
  font-weight: 200;
  color: var(--global-text);
  -webkit-text-stroke: initial;
  -webkit-text-fill-color: var(--global-text);
  text-align: center;
`;

const NotFound: React.FC = () => {
  useEffect(() => {
    document.title = '404 · Page Not Found';
  }, []);

  return (
    <Container>
      <Code>404</Code>
      <Message>Page Not Found</Message>
    </Container>
  );
};

export default NotFound;
