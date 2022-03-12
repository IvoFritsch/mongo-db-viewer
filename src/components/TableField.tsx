
import styled from "styled-components";
import DepthAdjust from "./DepthAdjust";
import Xarrow, { useXarrow } from "react-xarrows";
import React, { useCallback, useEffect, useState } from "react";

const FieldContainer = styled.div<{clickable?: boolean, isShown?: boolean}>`
  border-top: ${props => props.isShown ? '1px solid gray' : ''};
  display: flex;
  cursor: ${props => props.clickable ? 'pointer' : 'unset'};
`

const FieldName = styled.div`
  padding-right: 2px;
  font-weight: bold;
  color: #a81e1e;
`

const FieldType = styled.div`
  padding-left: 2px;
  font-weight: bold;
  color: #339415;
`

const BlueSpan = styled.span`
  color: #1616ad;
`

export interface IFieldDescriptor {
  __DBVIEWER__ref?: string
  __DBVIEWER__type?: string | any
  __DBVIEWER__isFinal?: boolean
  __DBVIEWER__docs?: string
  __DBVIEWER__enum?: string[]
}

interface IProps {
  tableName: string
  fieldName: string
  fieldDescriptor: IFieldDescriptor
  fatherQualifiedName?: string
  depth?: number
  show?: boolean
}

export default React.memo(function TableField({ tableName, fieldName, fieldDescriptor, fatherQualifiedName='', depth = 0, show=true}: IProps) {
  
  //console.log('render field', tableName, fieldName)

  const [isOpen, setIsOpen] = useState(depth === 1 && !fieldDescriptor.__DBVIEWER__isFinal ? false : true)
  const [focusedTable, setFocusedTable] = useState<string>()
  const updateXarrows = useXarrow()

  let qualifiedName = fatherQualifiedName
  if(fieldName) {
    qualifiedName = (fatherQualifiedName || tableName) + '.' + fieldName
  }

  const onMouseOver = useCallback(() => {
    PubSub.publish('SHOW-FLOATING-HINT', generateFieldDocumentationContent(fieldName, qualifiedName, fieldDescriptor))
  }, [fieldName, qualifiedName, fieldDescriptor])

  const onMouseOut = useCallback(() => {
    PubSub.publish('HIDE-FLOATING-HINT')
  }, [])

  useEffect(() => {
    if(!fieldDescriptor.__DBVIEWER__ref) return
    const subId = PubSub.subscribe('TABLE-FOCUS', (_, focusedName) => {
      setFocusedTable(focusedName)
    })
    return () => { PubSub.unsubscribe(subId) }
  }, [fieldDescriptor])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(updateXarrows, [isOpen])

  let fieldType = fieldDescriptor.__DBVIEWER__type
  if(typeof fieldType === 'object') {
    fieldType = fieldType.constructor.name
  }
  let fieldTypeText = fieldType
  let fieldClosingTag = ''
  if(fieldType === "Object") {
    fieldTypeText = '{'
    fieldClosingTag = '}'
  } else if(fieldType === "Array") {
    fieldTypeText = '['
    fieldClosingTag = ']'
  }
  let hasChildren = false
  let isArray = false
  if(fieldType === "Object") {
    hasChildren = true
  } else if(fieldType === "Array") {
    hasChildren = true
    isArray = true
  }
  const ret = [
    <FieldContainer id={qualifiedName} 
                    clickable={!fieldDescriptor.__DBVIEWER__isFinal}
                    onClick={fieldDescriptor.__DBVIEWER__isFinal ? undefined : () => setIsOpen(o => !o)}
                    isShown={show}
                    onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      {show &&
        <>
          <DepthAdjust depth={depth} />
          <FieldName>{fieldName}</FieldName> 
          { fieldName ? ':' : '' }
          <FieldType
          >{fieldTypeText} {!isOpen && ( '... ' + fieldClosingTag)} {fieldDescriptor.__DBVIEWER__ref && <BlueSpan>→ {fieldDescriptor.__DBVIEWER__ref}</BlueSpan>}</FieldType>
        </>
      }
    </FieldContainer>
  ]
  if(hasChildren) {
    Object.entries(fieldDescriptor.__DBVIEWER__type).sort(([a], [b]) => {
      if(a > b) return 1
      if(b > a) return -1
      return 0
    }).forEach(([name, value]) => {
      ret.push(
        <TableField show={show && isOpen}
                    tableName={tableName} 
                    fieldName={isArray ? '' : name} 
                    fatherQualifiedName={qualifiedName}
                    fieldDescriptor={value as any} 
                    depth={depth + 1}/>
      )
    })
    if(show && isOpen){
      ret.push(
        <FieldContainer key={qualifiedName + '-finish'} isShown>
          <DepthAdjust depth={depth} />
          <FieldType>{fieldClosingTag}</FieldType>
        </FieldContainer>
      )
    }
  }

  const mustHighlightArrows = focusedTable === tableName || focusedTable === fieldDescriptor.__DBVIEWER__ref

  return (
    <>
      {ret}
      {fieldDescriptor.__DBVIEWER__ref && fieldDescriptor.__DBVIEWER__ref !== tableName&&
        <Xarrow start={qualifiedName} 
          end={`${fieldDescriptor.__DBVIEWER__ref}._id`} 
          labels={{ start: show && isOpen ? fieldDescriptor.__DBVIEWER__ref : undefined }}
          showTail
          tailShape="circle" 
          startAnchor={['left', 'right']}
          endAnchor={['left', 'right']}
          zIndex={10000}
          color={mustHighlightArrows ? '#2e2f94' : 'CornflowerBlue'}
          strokeWidth={mustHighlightArrows ? 3 : 2}/>}
    </>
  )
})

function generateFieldDocumentationContent(fieldName: string, qualifiedName: string, fieldDescriptor: IFieldDescriptor) {
  return (
    <div>
      <i>
        <b>{qualifiedName}
        {fieldDescriptor.__DBVIEWER__isFinal && 
          <span style={{color: 'gold'}}> : {fieldDescriptor.__DBVIEWER__type}</span>}
        </b>
      </i>
      {fieldDescriptor.__DBVIEWER__docs && 
        <>
          <br />
          <span>{fieldDescriptor.__DBVIEWER__docs}</span>
        </>
      }
      {fieldName === '__v' && 
        <>
          <br />
          <span>Esse campo representa a versão do registro, sempre que o registro é modificado, o valor desse campo é automaticamente incrementado.</span>
        </>
      }
      {fieldName === 'createdAt' && 
        <>
          <br />
          <span>A data/hora em que esse registro foi criado.</span>
        </>
      }
      {fieldName === 'updatedAt' && 
        <>
          <br />
          <span>A data/hora da última vez que esse registro foi modificado.</span>
        </>
      }
      <hr />
      {fieldDescriptor.__DBVIEWER__type === '?????' && 
        <>
          <span>Campos do tipo '?????' podem ter qualquer formato, ele não foi predefinido.</span>
        </>
      }
      {fieldDescriptor.__DBVIEWER__ref && 
        <>
          <span>O valor desse campo aponta para um registro da tabela <b style={{color: '#4bd047'}}>{fieldDescriptor.__DBVIEWER__ref}</b>.</span>
        </>
      }
      {!fieldDescriptor.__DBVIEWER__isFinal && 
        <>
          <span>Esse campo tem filhos, clique para expandir/colapsar...</span>
        </>
      }
      {fieldDescriptor.__DBVIEWER__enum && 
        <>
          <span>Esse campo tem os seguintes valores possíveis:</span>
          <ul>
            {fieldDescriptor.__DBVIEWER__enum.map(e => 
              <li key={e}>{e}</li>
            )}
          </ul>
        </>
      }
    </div>
  )
}