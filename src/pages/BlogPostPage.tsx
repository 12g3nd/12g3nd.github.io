import { useParams } from 'react-router-dom';
import type { MDXComponents } from 'mdx/types';

import PageTransition from '../components/PageTransition';
import PostLayout from '../components/PostLayout';
import ScrambleText from '../components/ScrambleText';
import NotFound from './NotFound';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { posts, transmissionOf } from '../data/posts';
import { postBodies } from '../data/postBodies';
import './BlogPost.css';

// Markdown links open in a new tab when external — mirrors the original posts,
// so authors just write [text](url) and never repeat target/rel by hand.
const mdxComponents: MDXComponents = {
  // Essay art is always below the fold — the images sit thousands of pixels
  // into a long read — so none of it should compete with the first paint.
  // Decoding async keeps a large photo off the main thread as well.
  img: ({ ...rest }) => <img loading="lazy" decoding="async" {...rest} />,
  a: ({ href, children, ...rest }) => {
    const external = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
};

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = posts.find((p) => p.slug === slug);
  const Body = postBodies[slug];

  // Called unconditionally (rules of hooks); falls back for the missing case.
  useDocumentMeta(
    post ? `${post.title} // Srihith Jarabana` : 'Not Found // Srihith Jarabana',
    post?.abstract
  );

  if (!post || !Body) return <NotFound />;

  const transmission = transmissionOf(slug);

  return (
    <PageTransition>
      <section className="section" style={{ paddingBottom: '5rem' }}>
        <div className="section-header" style={{ marginBottom: '3rem' }}>
          <h2><ScrambleText text={transmission} /></h2>
          <p className="post-log-date">{post.date} // LOG</p>
        </div>

        <PostLayout slug={post.slug} date={post.date}>
          <h1 className="post-title-main">{post.title}</h1>
          <div className="post-prose">
            <Body components={mdxComponents} />
          </div>
        </PostLayout>
      </section>
    </PageTransition>
  );
}
