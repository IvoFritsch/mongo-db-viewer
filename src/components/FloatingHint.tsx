import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

interface IPosition {
  x: number 
  y: number
}

const ContainerDiv = styled.div.attrs<IPosition>(props => ({
  style: {
    top: `${props.y + 3}px`,
    left: `${props.x + 3}px`
  }
}))<IPosition>`
  position: fixed;
  background-color: #120210;
  padding: 2px;
  border-radius: 5px;
  color: white;
  max-width: 500px;
`

const InnerContainerDiv = styled.div`
  border-radius: 3px;
  padding: 5px;
  padding-top: 5px;
  border: 5px solid #1d0142;
`

function FloatingHint() {

  const [isAppearing, setIsAppearing] = useState(true)
  const [position, setPosition] = useState<IPosition>({ x: 0, y: 0 })
  const [hintContent, setHintContent] = useState<JSX.Element | undefined>()

  useEffect(() => {
    if(!isAppearing) return
    function mouseMoveListener(e: MouseEvent){
      let x = e.clientX;
      let y = e.clientY;
      setPosition({ x, y })
    }
    
    document.addEventListener('mousemove', mouseMoveListener);
    return () => document.removeEventListener('mousemove', mouseMoveListener)
  }, [isAppearing])
  
  useEffect(() => {
    const subId = PubSub.subscribe('SHOW-FLOATING-HINT', (_, hintContent) => {
      setHintContent(hintContent)
      setIsAppearing(true)
    })
    return () => { PubSub.unsubscribe(subId) }
  }, [])

  useEffect(() => {
    const subId = PubSub.subscribe('HIDE-FLOATING-HINT', (_, hintContent) => {
      console.log('SHOW-FLOATING-HINT')
      setHintContent(undefined)
      setIsAppearing(false)
    })
    return () => { PubSub.unsubscribe(subId) }
  }, [])

  return (
    (isAppearing && hintContent) ? 
      <ContainerDiv x={position.x} y={position.y}>
        <InnerContainerDiv>
          {hintContent}
        </InnerContainerDiv>
      </ContainerDiv>
      :
      null
  )
}

export default FloatingHint