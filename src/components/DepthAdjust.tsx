import React, { useMemo } from "react";
import styled from "styled-components";

const AdjustDiv = styled.div`
  width: 30px;
`

function DepthAdjust({ depth }: { depth: number }) {
  const divs = useMemo(() => {
    const ret = []
    for(let i = 0; i < depth; i++) {
      ret.push(<AdjustDiv key={i}/>)
    }
    return ret
  }, [depth])

  return (
    <div style={{ display: 'flex' }}>
      {divs}
    </div>
  )
}

export default React.memo(DepthAdjust)