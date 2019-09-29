import { ContentType, FieldType } from 'contentful';
import { EOL } from 'os';

function transformType(typeString: FieldType) {
  switch (typeString) {
    case 'Number':
    case 'Integer':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Text':
    case 'Symbol':
      return 'string';
    case 'Date':
      return 'Date';
    case 'Array':
      return 'any[]';
    case 'Object':
      return '{ [prop: string]: any }';
    case 'Location':
      return '{\n    lon: number,\n    lat: number,\n  }';
    default:
      return 'any';
  }
}

interface Options {
  propertyLang?: boolean;
}

export const contentTypeToTs = (contentTypeDef: ContentType, opts: Options = {}) => {
  const wlines: string[] = [];
  const writeLn = (str: string) => wlines.push(`${str}${EOL}`);

  const name = contentTypeDef.name;
  const id = contentTypeDef.sys.id;

  writeLn(`/** ${name} */`);
  writeLn(`type ${id} = {`);

  contentTypeDef.fields.forEach((field, fieldIndex, fields) => {
    const prop = field.id;
    const disabled = field.disabled;
    const descripcion = field.name;
    const type = transformType(field.type);
    const optional = !field.required;
    const typeEnum = field.validations && field.validations.find(e => 'in' in e);
    const isLastField = fieldIndex + 1 === fields.length;

    if (disabled) return;

    const v = typeEnum
      ? type === 'string'
        ? typeEnum.in.map(e => JSON.stringify(e)).join(' | ')
        : typeEnum.in.join(' | ')
      : type;

    writeLn(`  /** ${descripcion} */`);
    if (opts.propertyLang) {
      writeLn(`  ${prop}${optional ? '?' : ''}: { [lang: string]: ${v} };`);
    } else {
      writeLn(`  ${prop}${optional ? '?' : ''}: ${v};`);
    }

    if (!isLastField) {
      writeLn('');
    }
  });

  writeLn(`}`);

  return wlines.join('');
}
