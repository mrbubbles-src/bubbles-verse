'use client';

import { useCallback, useState } from 'react';

import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import type { PDFDocumentProxy } from 'pdfjs-dist';

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  HugeiconsIcon,
} from '@bubbles/ui/lib/hugeicons';
import { toast } from '@bubbles/ui/lib/sonner';
import { Button } from '@bubbles/ui/shadcn/button';

import { Locale } from '@/i18n-config';
import CurriculumVitaeSkeleton from './curriculum-vitae-skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

const resizeObserverOptions = {};

const maxWidth = 800;

const CurriculumVitae = ({ lang }: { lang: Locale }) => {
  const [numPages, setNumPages] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState<number>(1);

  const scrollToPage = (page: number) => {
    const el = document.querySelector<HTMLElement>(
      `[data-page-number="${page}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const gotoPrev = () => {
    if (numPages && currentPage === 1) {
      scrollToPage(numPages);
      setCurrentPage(numPages);
    } else if (currentPage > 1) {
      const prev = currentPage - 1;
      scrollToPage(prev);
      setCurrentPage(prev);
    }
  };

  const gotoNext = () => {
    if (numPages) {
      if (currentPage === numPages) {
        scrollToPage(1);
        setCurrentPage(1);
      } else {
        const next = currentPage + 1;
        scrollToPage(next);
        setCurrentPage(next);
      }
    }
  };

  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, resizeObserverOptions, onResize);

  function onDocumentLoadSuccess({
    numPages: nextNumPages,
  }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
    setIsLoading(false);
  }

  return (
    <>
      <div className="flex w-full flex-col items-center my-2.5 p-2.5">
        <div
          className="w-full max-w-[calc(100%-2em)] my-4 relative"
          ref={setContainerRef}>
          {isLoading && <CurriculumVitaeSkeleton />}

          <Document
            className="flex flex-col items-center"
            file={`/cv_manuel_fahrenholz_${lang}_view.pdf`}
            onError={() => {
              toast.error('Something went wrong, please try again later.');
            }}
            onLoadError={() => {
              toast.error('Error loading PDF, please try again later.');
            }}
            onSourceError={() => {
              toast.error('PDF was not found, please try again later.');
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            loading
            options={options}>
            {Array.from({ length: numPages ?? 0 }, (_, index) => (
              <div key={`page_${index + 1}`} className="relative my-4">
                <Page
                  pageNumber={index + 1}
                  className="shadow-xl dark:shadow-popover-foreground/10 scroll-mt-24 xl:scroll-mt-32"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onError={() => {
                    toast.error(
                      'Something went wrong, please try again later.'
                    );
                  }}
                  onLoadError={() => {
                    toast.error('Error loading PDF, please try again later.');
                  }}
                  onRenderError={() => {
                    toast.error('Error rendering PDF, please try again later.');
                  }}
                  width={
                    containerWidth
                      ? Math.min(containerWidth, maxWidth)
                      : maxWidth
                  }
                />
              </div>
            ))}
          </Document>
          {!isLoading && numPages && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transform  flex gap-2 opacity-25 hover:opacity-100 transition-all duration-300 ease-in-out">
              <Button
                size="icon"
                onClick={gotoPrev}
                className="rounded-full shadow-md dark:shadow-popover-foreground/10">
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  strokeWidth={1.5}
                  className="size-12"
                />
              </Button>
              <Button
                size="icon"
                onClick={gotoNext}
                className="rounded-full shadow-md dark:shadow-popover-foreground/10">
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={1.5}
                  className="size-12"
                />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CurriculumVitae;
