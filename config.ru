require 'rack'

use Rack::Static,
    :urls => ["/assets"],
    :root => "public"

map "/" do
  run lambda { |env|
    [
      200,
      {
        'Content-Type' => 'text/html',
        'Cache-Control' => 'public, max-age=86400'
      },
      File.open('public/index.html', File::RDONLY)
    ]
  }
end

map "/vietnamese-restaurants-singapore" do
  run lambda { |env|
    [
      200,
      {
        'Content-Type' => 'text/html',
        'Cache-Control' => 'public, max-age=86400'
      },
      File.open('public/map.html', File::RDONLY)
    ]
  }
end

map "/mon-an-3-mien-ngay-tet" do
  run lambda { |env|
    [
      200,
      {
        'Content-Type' => 'text/html',
        'Cache-Control' => 'public, max-age=86400'
      },
      File.open('public/mon-an-3-mien-ngay-tet.html', File::RDONLY)
    ]
  }
end

