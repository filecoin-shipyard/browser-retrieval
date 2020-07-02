import React from 'react';
import classNames from 'classnames';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import Pre from 'src/popup/components/Pre';
import usePort from 'src/popup/hooks/usePort';
import channels from 'src/shared/channels';
import './Peers.css';

function Peers({ className, ...rest }) {
  const peersState = usePort(channels.peers);

  return (
    <Card className={classNames(className, 'p-4')} {...rest}>
      <Label className="mb-2">Peers connected:</Label>
      <Pre className="Peers--pre">{peersState}</Pre>
    </Card>
  );
}

export default Peers;
