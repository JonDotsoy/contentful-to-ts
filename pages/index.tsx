import { CSSProperties, useState, useMemo, ChangeEvent } from "react";
import { contentTypeToTs } from "../contentTypeToTs";
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import Head from 'next/head';
import url from 'url';
import path from 'path';
import { useStateStorage } from "../useStateStorage";

const styles = {
  textarea: {
    width: '100%',
    minHeight: '50vh'
  } as CSSProperties,
  input: {

  },
};

const formatURIContent = ({
  https = true,
  host,
  space,
  contentType,
  accessToken,
}) => {
  return {
    publicUrl: url.format({
      protocol: https ? 'https' : 'http',
      slashes: true,
      hostname: host,
      pathname: path.join('spaces', space, 'content_types', contentType),
      query: {
        access_token: '*'.repeat(6)
      }
    }),
    secretUrl: url.format({
      protocol: https ? 'https' : 'http',
      slashes: true,
      pathname: path.join('spaces', space, 'content_types', contentType),
      hostname: host,
      query: {
        access_token: accessToken,
      }
    }),
  }
}

const Inpt = ({
  id,
  label,
  state: [
    stateValue,
    setState,
  ],
  help,
}: {
  id: string,
  label: string,
  state: ReturnType<typeof useState>,
  help?: string,
}) => {
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value);
  }

  return <div className="input-value">
    <label htmlFor={id}>{label}</label>
    <input id={id} style={styles.input} placeholder={help} defaultValue={stateValue as any} onChange={change}></input>
  </div>;
}

const keyAccessToken = 'cnt_accessToken';
const keyCode = 'cnt_code';
const keyScpace = 'cnt_space';
const keyHostContent = 'cnt_hostContent';
const keyContentType = 'cnt_contentType';
const keyHistorySearch = 'cnt_historySearch';

export default () => {
  const [loadingContentType, setLoadingContentType] = useState(false);
  const [loadingContentTypeError, setLoadingContentTypeError] = useState(null as null | string);
  const [code, setCode] = useStateStorage(keyCode, '');
  const [accessToken, setAccessToken] = useStateStorage(keyAccessToken, '7d92a7a0582c2d5a46f6a47e53172c5b22710147e07a340076898c4009e96421');
  const [hostContent, setHostContent] = useStateStorage(keyHostContent, 'cdn.contentful.com');
  const [space, setSpace] = useStateStorage(keyScpace, '6ryxe22eim9l');
  const [contentType, setContentType] = useStateStorage(keyContentType, 'pages');
  const [historySearch, setHistorySearch] = useStateStorage(keyHistorySearch, [] as {
    accessToken: typeof accessToken,
    hostContent: typeof hostContent,
    space: typeof space,
    contentType: typeof contentType,
  }[]);
  const { publicUrl, secretUrl } = formatURIContent({
    host: hostContent,
    space,
    accessToken,
    contentType,
  });

  const htmlCode = useMemo(() => {
    return Prism.highlight(code, Prism.languages.typescript, 'typescript');;
  }, [code]);

  const buscar = async () => {
    setLoadingContentType(true);
    setLoadingContentTypeError(null);

    const res = await fetch(secretUrl, { method: 'GET' });

    if (res.status !== 200) {
      setLoadingContentType(false);
      setLoadingContentTypeError(`${res.status} ${res.statusText}\n${await res.text()}`);
      return console.error(res.status, res.statusText, res.body);
    }

    setHistorySearch(history => {
      const s = {
        accessToken,
        hostContent,
        space,
        contentType,
      };
      const k = JSON.stringify(s);
      const found = history.find(e => JSON.stringify(e) === k);
      if (found) return history;
      return [...history, s];
    });

    const contentTypeDef = await res.json();

    const code = contentTypeToTs(contentTypeDef);

    setLoadingContentType(false);
    setCode(code);
  }

  return <div>
    <Head>
      <link rel="stylesheet" href="https://unpkg.com/prismjs@1.17.1/themes/prism-coy.css" />

      <meta property="og:url" content="https://contentful-to-ts.jondotsoy.now.sh" />
      <meta property="og:title" content="Contentful to Typescript" />
      <meta property="og:description" content="Convert contentful entry to typescript type." />
      <meta property="og:site_name" content="contentful-to-ts" />
      <meta property="og:image" content="https://i.imgur.com/SfC4eu5l.png"/>

      <style>{`
        body {
          font-family: sans-serif;  
        }

        .control-form {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-column-gap: 10px;
          grid-row-gap: 15px;
        }
        .control-form .input-value {
          display: contents;
        }
        .control-form .input-value label {
          align-self: center;
        }
        .control-form .ctr {
          grid-column-start: 1;
          grid-column-end: 3;
        }
        .control-form .btn-load {
          grid-column-start: 1;
          grid-column-end: 3;
          justify-self: center;
        }
        .input-value input {
          padding: 10px;
        }
      `}</style>
    </Head>

    <div className="control-form">
      <Inpt id={'accessToken'} label="Access Token" state={[accessToken, setAccessToken]} help="Ej. abc..." />
      <Inpt id={'hostContent'} label="Host Content" state={[hostContent, setHostContent]} help="Ej. preview.contentful.com" />
      <Inpt id={'space'} label="Space" state={[space, setSpace]} help="Ej. abch124..." />
      <Inpt id={'contentType'} label="Content Type" state={[contentType, setContentType]} help="Ej. vehicle" />

      <div className="ctr">
        <div>
          <a href={secretUrl} target="_blank">{publicUrl}</a>
        </div>
      </div>

      <button className="btn-load" type="button" onClick={buscar} disabled={loadingContentType}>{loadingContentType ? 'Cargando' : 'Cargar'} Content Type</button>
    </div>

    <ul>
      {historySearch.map(history => {
        const act = () => {
          setSpace(history.space);
          setHostContent(history.hostContent);
          setContentType(history.contentType);
          setAccessToken(history.accessToken);
        };

        return <li><button onClick={act} type="button">{`(${history.hostContent}) ${history.space}/${history.contentType}`}</button></li>
      })}
    </ul>

    {loadingContentTypeError && <div>
      <div><pre><code>{loadingContentTypeError}</code></pre></div>
    </div>}

    <pre className="language-typescript">
      <code className="language-typescript" dangerouslySetInnerHTML={{ __html: htmlCode }}></code>
    </pre>

    <div>Github <a href="https://github.com/JonDotsoy/contentful-to-ts" target="_blank">https://github.com/JonDotsoy/contentful-to-ts</a></div>

  </div>
}
