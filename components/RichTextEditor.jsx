'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] border rounded-md p-4 bg-muted animate-pulse">
      <div className="h-4 w-1/4 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/4 bg-gray-200 rounded" />
    </div>
  )
});

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.root.setAttribute('spellcheck', 'false');
    }
  }, []);

  return (
    <div className="h-[200px]">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-[150px]"
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }}
        formats={[
          'header',
          'bold', 'italic', 'underline', 'strike',
          'list', 'bullet',
          'link', 'image'
        ]}
      />
    </div>
  );
} 