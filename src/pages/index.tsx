import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header/index';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  preview: boolean;
  postsPagination: PostPagination;
}

function formatPosts(results): Post[] {
  return results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: Array.isArray(post.data.title)
          ? RichText.asText(post.data.title)
          : post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
}

export default function Home({
  preview,
  postsPagination,
}: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  const [postResults, setPostResults] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState(next_page);
  function loadMoreData(): void {
    if (!nextPage) {
      return;
    }
    fetch(nextPage)
      .then(res => res.json())
      .then(posts => {
        setNextPage(posts.next_page);
        setPostResults([...postResults, ...formatPosts(posts.results)]);
      });
  }

  function formatDate(date: string): string {
    const formattedDate = format(new Date(date), 'dd  MMM yyyy', {
      locale: ptBR,
    });
    return formattedDate;
  }

  return (
    <>
      <Header />

      <main className={styles.homeContainer}>
        <article className={styles.homeContent}>
          {postResults.map(post => (
            <div className={styles.homePost} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>{post.data.title}</a>
              </Link>
              <p>{post.data.subtitle}</p>
              <div className={commonStyles.publicationInfo}>
                <time>
                  <FiCalendar />
                  {formatDate(post.first_publication_date)}
                </time>
                <span>
                  <FiUser />
                  {post.data.author}
                </span>
              </div>
            </div>
          ))}
          {nextPage && (
            <button
              type="button"
              onClick={loadMoreData}
              className={commonStyles.btnLink}
            >
              Carregar mais posts
            </button>
          )}
        </article>
      </main>
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts'],
      pageSize: 1,
      page: 1,
      ref: previewData?.ref ?? null,
    }
  );
  const { next_page } = postsResponse;
  const posts: Post[] = formatPosts(postsResponse.results);
  const postsPagination: PostPagination = { next_page, results: posts };
  return {
    props: { postsPagination, preview },
  };
};
