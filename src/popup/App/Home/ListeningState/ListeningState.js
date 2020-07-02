import React from 'react';
import classNames from 'classnames';
import Card from 'src/popup/components/Card';
import Label from 'src/popup/components/Label';
import Pre from 'src/popup/components/Pre';
import useListeningState from 'src/popup/hooks/useListeningState';

function ListeningState({ className, ...rest }) {
  const listeningState = useListeningState();

  return (
    <Card className={classNames(className, 'p-4')} {...rest}>
      <Label className="mb-2">Listening on:</Label>
      <Pre>{listeningState}</Pre>
    </Card>
  );
}

export default ListeningState;
