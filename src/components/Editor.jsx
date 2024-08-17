import React, { useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import Actions from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Add event listener for changes
    editor.onDidChangeModelContent((event) => {
      if (!isRemoteChange.current) {
        const { changes } = event;
        changes.forEach(change => {
          const { range, text, rangeLength } = change;

          if (rangeLength === 0 && text) {
            console.log('Input:');
          } else if (rangeLength > 0 && !text) {
            console.log('Cut');
          } else if (rangeLength > 0 && text) {
            console.log('Paste or Replace');
          }

        });

        // Emit the change to the server
        const code = editorRef.current.getValue();
        onCodeChange(code);

        socketRef.current.emit(Actions.CODE_CHANGE, { roomId, code });
      }
    });
  }

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(Actions.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          // Temporarily disable the event listener
          isRemoteChange.current = true;
          editorRef.current.setValue(code);
          // Re-enable the event listener after setting the value
          isRemoteChange.current = false;
        }
      });
    }

    return () => {
      socketRef.current.off(Actions.CODE_CHANGE);
    };
  }, [socketRef.current]);

  return (
    <div className="editor-container">
      <MonacoEditor
        id="realTimeEditor"
        height="100vh"
        defaultLanguage="javascript"
        defaultValue="// code here"
        theme="vs-dark"
        onMount={handleEditorDidMount}
      />
      
    </div>
  );
};

export default Editor;
