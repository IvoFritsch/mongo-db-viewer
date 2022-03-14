//import { ArcherContainer } from 'react-archer';
import DraggableTable from "./components/DraggableTable";
import { useMemo, useState } from "react";
import { Xwrapper } from 'react-xarrows';
import Draggable from "react-draggable";
import styled from "styled-components";

import AuthIdModel from './models/AuthId.json'
import BatchModel from './models/Batch.json'
import AttendanceModel from './models/Attendance.json'
import FinanceModel from './models/Finance.json'
import FloatingHint from "./components/FloatingHint";

const CoverAllDiv = styled.div.attrs<{ y : number, x: number }>(props => ({
  style: {
    marginTop: `-${Math.max(props.y, 0)}px`,
    marginLeft: `-${Math.max(props.x, 0)}px`,
    paddingTop: `${Math.max(props.y, 0)}px`,
    paddingLeft: `${Math.max(props.x, 0)}px`,
    width: `calc(100vw - ${Math.min(props.x, 0)}px)`,
    height: `calc(100vh - ${Math.min(props.y, 0)}px)`
  },
}))<{ y : number, x: number }>`
  position: fixed;
  background-image: url('/grid.jpg');
`

function App() {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })


  return (
    <div>
    <Draggable handle=".main-drag-div" scale={1} onDrag={(_, data) => setDragOffset({ x: data.x, y: data.y })}>
      <CoverAllDiv className="main-drag-div" x={dragOffset.x} y={dragOffset.y}>
        <Xwrapper>
          {/* <DraggableTable name="Batch" descriptor={BatchModel}/>  */}
          <DraggableTable name="Attendance" descriptor={AttendanceModel}/> 
        </Xwrapper>
      </CoverAllDiv>
    </Draggable>
    <FloatingHint />
    </div>
  );
}

export default App;
