export const simpleTweetHtml = `
<article data-testid="tweet" role="article" tabindex="0">
  <div>
    <div data-testid="User-Name">
      <div>
        <a href="/rauchg" role="link">
          <span>Guillermo Rauch</span>
        </a>
      </div>
      <div>
        <a href="/rauchg" role="link" tabindex="-1">
          <span>@rauchg</span>
        </a>
      </div>
      <div>
        <a href="/rauchg/status/1789012345678901234?s=20" role="link">
          <time datetime="2026-05-10T14:30:00.000Z">May 10</time>
        </a>
      </div>
    </div>
    <div data-testid="tweetText" lang="en">
      <span>Shipping faster than ever with local-first tooling.</span>
    </div>
  </div>
</article>
`;

export const mediaTweetHtml = `
<article data-testid="tweet" role="article" tabindex="0">
  <div>
    <div data-testid="User-Name">
      <div>
        <a href="/shadcn" role="link">
          <span>shadcn</span>
        </a>
      </div>
      <div>
        <a href="/shadcn" role="link" tabindex="-1">
          <span>@shadcn</span>
        </a>
      </div>
      <div>
        <a href="/shadcn/status/1789999999999999999" role="link">
          <time datetime="2026-05-12T09:15:00.000Z">May 12</time>
        </a>
      </div>
    </div>
    <div data-testid="tweetText" lang="en">
      <span>New component updates are live!</span>
    </div>
    <div>
      <div data-testid="tweetPhoto">
        <img src="https://pbs.twimg.com/media/F123456_thumb.jpg:large" alt="Component preview 1" />
      </div>
      <div data-testid="tweetPhoto">
        <img src="https://pbs.twimg.com/media/F789012_thumb.jpg:large" alt="Component preview 2" />
      </div>
    </div>
  </div>
</article>
`;

export const videoTweetHtml = `
<article data-testid="tweet" role="article" tabindex="0">
  <div>
    <div data-testid="User-Name">
      <div>
        <a href="/karpathy" role="link">
          <span>Andrej Karpathy</span>
        </a>
      </div>
      <div>
        <a href="/karpathy" role="link" tabindex="-1">
          <span>@karpathy</span>
        </a>
      </div>
      <div>
        <a href="/karpathy/status/1795555555555555555" role="link">
          <time datetime="2026-05-15T18:00:00.000Z">May 15</time>
        </a>
      </div>
    </div>
    <div data-testid="tweetText" lang="en">
      <span>Video demo of the new tokenizer inspector.</span>
    </div>
    <div>
      <div data-testid="videoPlayer">
        <video poster="https://pbs.twimg.com/tweet_video_thumb/video_thumb_99.jpg" src="blob:https://x.com/abc-123"></video>
      </div>
    </div>
  </div>
</article>
`;

export const quotedTweetHtml = `
<article data-testid="tweet" role="article" tabindex="0">
  <div>
    <div data-testid="User-Name">
      <div>
        <a href="/swyx" role="link">
          <span>swyx</span>
        </a>
      </div>
      <div>
        <a href="/swyx" role="link" tabindex="-1">
          <span>@swyx</span>
        </a>
      </div>
      <div>
        <a href="/swyx/status/1801112223334445556" role="link">
          <time datetime="2026-05-18T12:00:00.000Z">May 18</time>
        </a>
      </div>
    </div>
    <div data-testid="tweetText" lang="en">
      <span>Totally agree with this observation on AI workflows:</span>
    </div>
    <!-- Quoted Tweet Box -->
    <div role="link" aria-label="Quoted Tweet">
      <div data-testid="User-Name">
        <span>Someone Else</span>
        <span>@someoneelse</span>
      </div>
      <a href="/someoneelse/status/1700000000000000000"></a>
      <div data-testid="tweetText">
        <span>Original thought from someone else.</span>
      </div>
    </div>
  </div>
</article>
`;
