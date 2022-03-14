require('dotenv').config()
global.requireModel = r => r
global.__ = s => s
const fs = require('fs')

const AttendanceSchema = require('./src/models/Attendance').schema


//console.log(AuthId.schema.paths.testObj.options.type)
//AuthIdSchema.eachPath(console.log)

//console.log(mountSchemaPaths(BatchSchema))
//mountSchemaPaths(BatchSchema)
mountSchemaPaths(AttendanceSchema)
//console.log(Object.keys(AuthIdSchema.paths))
// mountSchemaPaths(BatchSchema)

function mountSchemaPaths(schema) {
  let ret = {}
  let paths = remergeExplodedPathsIfNeeded(schema.paths)
  paths = Object.entries(paths)
  for(let i = 0; i < paths.length; i++) {
    const [name, type] = paths[i]
    const parsedType = diveIntoFieldType(type)
    if(parsedType) {
      ret[name] = diveIntoFieldType(type)
    }
  }
  ret = {
    __DBVIEWER__type: ret
  }
  fs.writeFileSync('./schemaJSON.json', JSON.stringify(ret, null, 2))
  return ret
}

function remergeExplodedPathsIfNeeded(obj) {
  const ret = {}

  // Para cada chave no objeto
  for (const objectPath in obj) {
    // Separa o path em seus components
    const parts = objectPath.split('.')

    // Cria os sub objetos necessários ao longo do caminho
    let target = ret
    let isFirstPart = true
    while (parts.length > 1) {
      const part = parts.shift()

      if(isFirstPart) {
        ret[part] = ret[part] || {
          instance: 'Mixed',
          options: {
            type: {}
          }
        }
        target = ret[part].options.type
      } else {
        target = target[part] = target[part] || {}
      }

      isFirstPart = false
    }

    // Seta o valor no final do caminho
    target[parts[0]] = obj[objectPath]
  }

  return ret
}

function diveIntoFieldType(fieldType) {
  let ret = {}
  const instanceName = fieldType.instance
  if(fieldType.options.ref) {
    ret.__DBVIEWER__ref = fieldType.options.ref
  }
  if(fieldType.options.default) {
    ret.__DBVIEWER__ref = fieldType.options.ref
  }
  if(fieldType.options.required) {
    ret.__DBVIEWER__required = fieldType.options.required
  }
  if(fieldType.options.enum) {
    ret.__DBVIEWER__enum = fieldType.options.enum
  }
  if(fieldType.options.documentation) {
    ret.__DBVIEWER__docs = fieldType.options.documentation
  }
  if(fieldType.options.default != undefined) {
    ret.__DBVIEWER__default = fieldType.options.default
  }
  if(['ObjectID', 'ObjectId', 'String', 'Number', 'Boolean', 'Date'].includes(instanceName)) {
    ret.__DBVIEWER__type = instanceName
    ret.__DBVIEWER__isFinal = true
    return ret
  }
  if(instanceName === 'Mixed' || instanceName === 'Array') {
    ret = { ...diveIntoArrayOrMixedField(fieldType.options.type), ...ret }
  }
  if(instanceName === 'Embedded') {
    ret = { ...mountSchemaPaths(fieldType.schema), ...ret }
  }
  return ret
  //console.log(fieldName, instanceName, fieldType.options)
  //if(fieldName !== 'testMixed') return
}

function diveIntoArrayOrMixedField(type){
  if(!type) return undefined
  let ref = undefined
  let enumeration = undefined
  let documentation = undefined
  let defaultValue = undefined
  let isRequired = undefined;
  [type, ref, enumeration, documentation, defaultValue, isRequired] = normalizeTypeDeclaration(type)

  if(type.constructor.name == 'Function' && type.name == 'Mixed') {
    return {
      __DBVIEWER__type: '?????',
      __DBVIEWER__isFinal: true,
      __DBVIEWER__docs: documentation,
      __DBVIEWER__default: defaultValue,
      __DBVIEWER__required: isRequired
    }
  }

  if(type.constructor.name == 'Object') {
    const ret = {}

    Object.entries(type).forEach(([k, v]) => {
      ret[k] = diveIntoArrayOrMixedField(v)
    })

    return {
      __DBVIEWER__type: ret,
      __DBVIEWER__docs: documentation,
      __DBVIEWER__default: defaultValue,
      __DBVIEWER__required: isRequired
    }
  }

  
  if(type.constructor.name == 'Array') {
    const ret = []

    type.forEach(v => {
      ret.push(diveIntoArrayOrMixedField(v))
    })

    return {
      __DBVIEWER__type: ret,
      __DBVIEWER__docs: documentation,
      __DBVIEWER__default: defaultValue,
      __DBVIEWER__required: isRequired
    }
  }

  if(type.instance) {
    return {
      ...diveIntoFieldType(type)
    }
  }
  return {
    __DBVIEWER__type: type.name,
    __DBVIEWER__isFinal: true,
    __DBVIEWER__ref: ref,
    __DBVIEWER__enum: enumeration,
    __DBVIEWER__docs: documentation,
    __DBVIEWER__default: defaultValue,
    __DBVIEWER__required: isRequired
  }

}

function normalizeTypeDeclaration(type) {
  if(type.constructor.name == 'Object' && type.type) {
    return [type.type, type.ref, type.enum, type.documentation, type.default, type.required]
  }
  return [type]
}