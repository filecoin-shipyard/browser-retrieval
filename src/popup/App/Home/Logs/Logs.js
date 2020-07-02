import React from 'react';
import classNames from 'classnames';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import Pre from 'src/popup/components/Pre';
import usePort from 'src/popup/hooks/usePort';
import channels from 'src/shared/channels';
import './Logs.css';

function Logs({ className, ...rest }) {
  const logs = usePort(channels.logs);

  return (
    <Card className={classNames(className, 'p-4')} {...rest}>
      <Label className="mb-2">Logs:</Label>
      <Pre className="Logs--pre">{logs}</Pre>
    </Card>
  );
}

export default Logs;
