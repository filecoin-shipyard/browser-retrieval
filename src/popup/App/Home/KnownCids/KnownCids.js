import React from 'react';
import prettyBytes from 'pretty-bytes';
import useOptions from 'src/popup/hooks/useOptions';
import Card from 'src/popup/components/Card';
import TableRow from 'src/popup/components/TableRow';
import TableCell from 'src/popup/components/TableCell';
import IconButton from 'src/popup/components/IconButton';
import Label from 'src/popup/components/Label';
import getData from 'src/shared/getData';
import removeData from 'src/shared/removeData';

function KnownCids(props) {
  const [{ knownCids }] = useOptions();
  const knownCidsIds = Object.keys(knownCids);

  if (!knownCidsIds.length) {
    return null;
  }

  async function downloadCid(cid) {
    const data = await getData(cid);

    const anchor = document.createElement('a');
    anchor.style = 'display: none';
    anchor.href = data;
    anchor.download = cid;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  return (
    <Card {...props}>
      <Label className="p-4">Known CIDs:</Label>
      <table>
        <tbody>
          {knownCidsIds.sort().map(cid => (
            <TableRow key={cid}>
              <TableCell className="font-mono">{cid}</TableCell>
              <TableCell number>{prettyBytes(knownCids[cid].size)}</TableCell>
              <TableCell buttons>
                <div className="flex">
                  <IconButton className="mr-4" icon="download" onClick={() => downloadCid(cid)} />
                  <IconButton icon="trash" onClick={() => removeData(cid)} danger />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default KnownCids;
