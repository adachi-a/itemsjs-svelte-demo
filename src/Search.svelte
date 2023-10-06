<script>
  import { onMount } from 'svelte';
  import Fuse from 'fuse.js';
  import itemsjs from 'itemsjs';
  import { toHiragana } from './utils/stringHelpers';

  const maxPageButtons = 10;
  const dataPath = './koban.json';
  const fuseKeys = ['name', 'yomi', 'prefecture', 'station', 'type', 'address'];
  const sortNames = { 'id asc': 'ID(昇順)', 'id desc': 'ID(降順)', 'yomi asc': 'よみ(昇順)', 'yomi desc': 'よみ(降順)' };
  const bucketThreshold = 5; // この件数以上のBucketは折り畳む

  let aggs = {};
  let collapsedState = {};
  let filters = {};
  let results = [];
  let search = '';

  let currentPage = 1;
  let itemCount = 0;
  let itemsPerPage = 10;
  let totalPages = 1;

  let items;
  let fuse;

  const configuration = {
    sortings: {
      id_asc: {
        field: 'id',
        order: 'asc',
      },
      id_desc: {
        field: 'id',
        order: 'desc',
      },
      yomi_asc: {
        field: 'yomi',
        order: 'asc',
      },
      yomi_desc: {
        field: 'yomi',
        order: 'desc',
      },
    },
    aggregations: {
      type: {
        title: '交番・駐在所の別',
        conjunction: false,
      },
      prefecture: {
        title: '都道府県',
        conjunction: false,
        size: 47,
      },
    },
    removeStopWordFilter: true,
    native_search_enabled: false,
    custom_id_field: 'id',
  };

  function initializeAggregations() {
    Object.keys(configuration.aggregations).forEach((key) => {
      configuration.aggregations[key].sort = key;
      configuration.aggregations[key].chosen_filters_on_top = false;
      configuration.aggregations[key].hide_zero_doc_count = true;
      filters[key] = [];
    });
  }

  function processSearchResults(searchResults) {
    results = searchResults.data || [];
    aggs = searchResults.data.aggregations || {};
    itemCount = searchResults.pagination ? searchResults.pagination.total : 0;
    totalPages = Math.ceil(itemCount / itemsPerPage);
  }

  function updateResults() {
    if (!items) return;
    const searchParams = {
      page: currentPage,
      per_page: itemsPerPage,
      sort: selectedSort,
      filters: filters,
    };
    if (search.length > 0) {
      searchParams.ids = fuse.search(search).map((item) => item.item.id);
    }
    const searchResults = items.search(searchParams);
    processSearchResults(searchResults);
  }

  onMount(() => {
    initializeAggregations();
    fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        items = itemsjs(data, configuration);
        fuse = new Fuse(data, {
          keys: fuseKeys,
          includeScore: true,
          threshold: 0,
          ignoreLocation: true,
        });
        updateResults();
      });
  });

  function goToPage(page) {
    currentPage = page;
    updateResults();
  }

  function getPageNumbers(totalPages, currentPage, maxPageButtons) {
    let startPage, endPage;

    if (totalPages <= maxPageButtons) {
      startPage = 1;
      endPage = totalPages;
    } else {
      let maxPagesBeforeCurrentPage = Math.floor(maxPageButtons / 2);
      let maxPagesAfterCurrentPage = Math.ceil(maxPageButtons / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPageButtons;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPageButtons + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    return Array.from(Array(endPage + 1 - startPage).keys()).map((i) => i + startPage);
  }

  function toggleFilter(title, key) {
    const index = filters[title].indexOf(key);
    if (index === -1) {
      filters[title] = [...filters[title], key];
    } else {
      filters[title] = filters[title].filter((item) => item !== key);
    }
    updateResults();
  }

  function isChecked(title, key) {
    return filters[title] && filters[title].includes(key);
  }

  let sortOptions = Object.keys(configuration.sortings).map((key) => ({ value: key, label: configuration.sortings[key].field + ' ' + configuration.sortings[key].order }));
  let selectedSort = sortOptions.length > 0 ? sortOptions[0].value : null;

  function updateSort(event) {
    selectedSort = event.target.value;
    currentPage = 1;
    updateResults();
  }

  // 折り畳み状態の切り替え
  function toggleCollapse(title) {
    collapsedState[title] = !collapsedState[title];
  }

  // Bucketの折り畳み状況を初期化する
  $: Object.keys(aggs).forEach((title) => {
    if (collapsedState[title] === undefined) {
      collapsedState[title] = true; // 最初は全部折り畳まれた状態
    }
  });

  $: {
    currentPage = 1;
    updateResults();
    filters;
    itemsPerPage;
    search;
  }
</script>

<input class="form-control my-4 w-100" type="text" bind:value={search} placeholder="Search..." />

<div class="row">
  <div class="col-md-3">
    <div class="mb-2">
      <label for="sortSelect">並べ替え:</label>
      <select id="sortSelect" bind:value={selectedSort} on:change={updateSort}>
        {#each sortOptions as { value, label } (value)}
          <option {value}>{sortNames[label]}</option>
        {/each}
      </select>
    </div>
    <div class="mb-3">
      <label for="itemsPerPageSelect">1ページあたりの表示数:</label>
      <select id="itemsPerPageSelect" bind:value={itemsPerPage}>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
    {#if aggs && Object.keys(aggs).length > 0}
      {#each Object.entries(aggs) as [title, details]}
        <div class="my-4">
          <ul class="list-group">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            {#if Array.isArray(details.buckets) && details.buckets.length > bucketThreshold}
              <button class="list-group-item d-flex align-items-center list-group-item-primary" on:click={() => toggleCollapse(title)}>
                <span>{details.title}</span><span class="mx-auto" />
                <span><i class={collapsedState[title] ? 'bi bi-chevron-down' : 'bi bi-chevron-up'} /></span>
              </button>
            {:else}
              <li class="list-group-item list-group-item-primary">
                <span>{details.title}</span>
              </li>
            {/if}
            {#if Array.isArray(details.buckets) && details.buckets.length > 0}
              {#each details.buckets as bucket, index (bucket.key)}
                {#if !collapsedState[title] || index < bucketThreshold}
                  <!-- render top (bucketThreshold) if collapsed -->
                  <li class="list-group-item d-flex align-items-center">
                    <input type="checkbox" checked={isChecked(title, bucket.key)} on:change={() => toggleFilter(title, bucket.key)} value={bucket.key} />
                    <span class="ms-2"
                      >{#if bucket.key}{bucket.key}{:else}N/A{/if}</span
                    >
                    <span class="mx-auto" />
                    <span class="badge bg-primary rounded-pill">{bucket.doc_count}</span>
                  </li>
                {/if}
              {/each}
            {:else}
              <li class="list-group-item">なし</li>
            {/if}
            {#if collapsedState[title] && details.buckets.length > bucketThreshold}
              <button class="list-group-item text-end" on:click={() => toggleCollapse(title)}><small>ほか{details.buckets.length - bucketThreshold}件を表示……</small></button>
            {/if}
          </ul>
        </div>
      {/each}
    {/if}
  </div>

  <div class="col-md-9">
    <ul class="list-group list-group-flush">
      {#if itemCount === 0}
        <p>該当する施設はありません</p>
      {:else}
        <p>{itemCount}件の検索結果</p>
        {#each results.items as { id, prefecture, station, name, type, yomi, address }}
          <li class="list-group-item">
            <div class="row">
              <div class="searchable">
                <h5 class="mb-0"><span class={type === '交番' ? 'text-primary' : 'text-danger'}>{prefecture}</span> {station} <ruby> {name} <rp>(</rp><rt>{toHiragana(yomi)}</rt><rp>)</rp></ruby>{type}</h5>
                <p class="mb-1"><small>{address}</small></p>
              </div>
            </div>
          </li>
        {/each}
      {/if}
    </ul>

    {#if itemCount > itemsPerPage}
      <nav aria-label="Page navigation example" class="mt-3 d-flex justify-content-center">
        <ul class="pagination">
          <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a class="page-link" href="#" on:click={() => goToPage(1)} aria-disabled={currentPage === 1}><i class="bi bi-chevron-bar-left" /></a>
          </li>
          <li class="page-item {currentPage === 1 ? 'disabled' : ''}">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a class="page-link" href="#" on:click={() => goToPage(currentPage - 1)} tabindex="-1" aria-disabled={currentPage === 1}><i class="bi bi-chevron-left" /></a>
          </li>
          {#if currentPage > maxPageButtons / 2 + 1}
            <li class="page-item disabled"><span class="page-link">...</span></li>
          {/if}
          {#each getPageNumbers(totalPages, currentPage, maxPageButtons) as page (page)}
            <li class="page-item {currentPage === page ? 'active' : ''}">
              <!-- svelte-ignore a11y-invalid-attribute -->
              <a class="page-link" href="#" on:click={() => goToPage(page)}>{page}</a>
            </li>
          {/each}
          {#if currentPage < totalPages - maxPageButtons / 2}
            <li class="page-item disabled"><span class="page-link">...</span></li>
          {/if}
          <li class="page-item {currentPage >= totalPages ? 'disabled' : ''}">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a class="page-link" href="#" on:click={() => goToPage(currentPage + 1)} aria-disabled={currentPage >= totalPages}><i class="bi bi-chevron-right" /></a>
          </li>
          <li class="page-item {currentPage >= totalPages ? 'disabled' : ''}">
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a class="page-link" href="#" on:click={() => goToPage(totalPages)} aria-disabled={currentPage >= totalPages}><i class="bi bi-chevron-bar-right" /></a>
          </li>
        </ul>
      </nav>
    {/if}
  </div>
</div>
