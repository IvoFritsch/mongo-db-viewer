require('dotenv').config()
const mongoose = require('mongoose')
global.requireModel = r => r
global.__ = s => s
const fs = require('fs')

const BatchSchema = require('./src/models/Batch').schema
const CidSchema = require('./src/models/Cid').schema
const ClinicUserSchema = require('./src/models/User/Clinic').schema

const AuthIdSchema = new mongoose.Schema(
  {
    // ID do usuário logado
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      autopopulate: true
    },
    // Quando esse login expira
    expiration: {
      type: Number,
      default: () => Date.now() + 100000
    },
    // Indica se essa sessão é valida
    valid: {
      type: Boolean,
      default: true
    },
    // Caso for true, esse usuário já completou os primeiros passos
    // serve para otimização, impedindo a verificação cada vez que o usuário navega no sistema
    veriFirstJourney: {
      type: Boolean,
      default: false
    },
    test: String,
    testObj: {
      ivo: Number,
      nums: [{
        kaka: Number
      }],
      pedro: {
        idade: Number
      },
      clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic'
      }
    },
    testArray: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    testMixed: 
      {
        type: mongoose.Schema.Types.Mixed,
        //ref: 'Attendance'
      }
    
  },
  {
    timestamps: true
  }
)

//console.log(AuthId.schema.paths.testObj.options.type)
//AuthIdSchema.eachPath(console.log)

//console.log(mountSchemaPaths(BatchSchema))
//mountSchemaPaths(BatchSchema)
mountSchemaPaths(AuthIdSchema)
//console.log(Object.keys(AuthIdSchema.paths))
// mountSchemaPaths(BatchSchema)

function mountSchemaPaths(schema) {
  let ret = {}
  let paths = remergeExplodedPathsIfNeeded(schema.paths)
  paths = Object.entries(paths)
  for(let i = 0; i < paths.length; i++) {
    const [name, type] = paths[i]
    ret[name] = diveIntoFieldType(type)
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
  if(['ObjectID', 'ObjectId', 'String', 'Number', 'Boolean', 'Date'].includes(instanceName)) {
    ret.__DBVIEWER__type = instanceName
    ret.__DBVIEWER__isFinal = true
    return ret
  }
  if(instanceName === 'Mixed' || instanceName === 'Array') {
    ret = diveIntoArrayOrMixedField(fieldType.options.type)
  }
  if(instanceName === 'Embedded') {
    ret = mountSchemaPaths(fieldType.schema)
  }
  return ret
  //console.log(fieldName, instanceName, fieldType.options)
  //if(fieldName !== 'testMixed') return
}

function diveIntoArrayOrMixedField(type){
  let ref = undefined;
  [type, ref] = normalizeTypeDeclaration(type)

  if(type.constructor.name == 'Function' && type.name == 'Mixed') {
    return {
      __DBVIEWER__type: '?????',
      __DBVIEWER__isFinal: true
    }
  }

  if(type.constructor.name == 'Object') {
    const ret = {}

    Object.entries(type).forEach(([k, v]) => {
      if(k == 'nums') {
        k
      }
      ret[k] = diveIntoArrayOrMixedField(v)
    })

    return {
      __DBVIEWER__type: ret
    }
  }

  
  if(type.constructor.name == 'Array') {
    const ret = []

    type.forEach(v => {
      ret.push(diveIntoArrayOrMixedField(v))
    })

    return {
      __DBVIEWER__type: ret
    }
  }
  console.log(type.instance)
  if(type.instance) {
    return {
      ...diveIntoFieldType(type)
    }
  }
  //console.log(type.constructor.name)
  return {
    __DBVIEWER__type: type.name,
    __DBVIEWER__isFinal: true,
    __DBVIEWER__ref: ref
  }

}

function normalizeTypeDeclaration(type) {
  if(type.constructor.name == 'Object' && type.type) {
    return [type.type, type.ref]
  }
  return [type]
}