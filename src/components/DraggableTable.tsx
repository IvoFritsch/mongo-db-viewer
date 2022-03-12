import React, { useCallback, useEffect, useState } from "react";
import Draggable from "react-draggable";
import { useXarrow } from "react-xarrows";
import styled from "styled-components";
import TableField, { IFieldDescriptor } from "./TableField";
import PubSub from 'pubsub-js'

const TableContainer = styled.div<{isFocused: boolean}>`
  background: #fff;
  border: ${props => props.isFocused ? '4px' : '2px'} solid ${props => props.isFocused ? '#2e2f94' : '#999'};
  border-radius: 5px;
  margin: 10px;
  float: left;
  position: absolute;
`;

const TableTitle = styled.div`
  border-bottom: 1px solid black;
  font-weight: bold;
  text-align: center;
`;

const TableBody = styled.div`
  padding: 5px;
`;

interface IProps {
  name: string,
  descriptor: IFieldDescriptor
}

export default React.memo(function DraggableTable({ name, descriptor }: IProps) {
  const updateXarrow = useXarrow();

  const [isFocused, setIsFocused] = useState(false)

  const onStartDrag = useCallback((e, ui) => {
    e.stopPropagation()
    PubSub.publish('TABLE-FOCUS', name)
  }, [name])

  useEffect(() => {
    const subId = PubSub.subscribe('TABLE-FOCUS', (_, focusedName) => {
      setIsFocused(name === focusedName)
    })
    return () => { PubSub.unsubscribe(subId) }
  }, [name])

  return (
    <>
    <Draggable handle=".table-title" scale={1} onStart={onStartDrag} onDrag={updateXarrow} onStop={updateXarrow}>
      <TableContainer isFocused={isFocused}>
        <TableTitle className="table-title">{name}</TableTitle>
        <TableBody>
          <TableField tableName={name} fieldName={""} fieldDescriptor={descriptor} />
        </TableBody>
      </TableContainer>
    </Draggable>
    </>
  );
})
